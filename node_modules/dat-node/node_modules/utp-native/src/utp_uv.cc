#include "utp_uv.h"
#include "nan.h"
#include <stdio.h>
#include <stdlib.h>

#ifndef _WIN32
#include <unistd.h>
#endif

#if (NODE_MODULE_VERSION <= NODE_0_10_MODULE_VERSION)
#define UV_LEGACY
#endif

#define UTP_UV_TIMEOUT_INTERVAL 500
#define UTP_UV_IP_STRING(ip) (const char *) (ip == NULL ? "127.0.0.1" : ip)
#define UTP_UV_DEBUG(msg) fprintf(stderr, "debug utp_uv: %s\n", (const char *) msg);

static void
on_uv_close (uv_handle_t *handle) {
  utp_uv_t *self = (utp_uv_t *) handle->data;
  if (self->context) {
    utp_destroy(self->context);
    self->context = NULL;
    if (self->on_close) self->on_close(self);
  }
}

static void
really_destroy (utp_uv_t *self) {
  uv_udp_t *handle = &(self->handle);
  uv_timer_t *timer = &(self->timer);

  // TODO: do these need error handling?
  uv_timer_stop(timer);
  uv_udp_recv_stop(handle);
  uv_close((uv_handle_t *) handle, on_uv_close);
}

#ifndef UV_LEGACY
static void
on_uv_alloc (uv_handle_t* handle, size_t suggested_size, uv_buf_t* buf) {
  utp_uv_t *self = (utp_uv_t *) handle->data;
  buf->base = (char *) &(self->buffer);
  buf->len = UTP_UV_BUFFER_SIZE;
}
#endif

static void
on_uv_read (uv_udp_t* handle, ssize_t nread, const uv_buf_t* buf, const struct sockaddr* addr, unsigned flags) {
  utp_uv_t *self = (utp_uv_t *) handle->data;
  int ret;

  if (nread < 0) {
    if (self->on_error) self->on_error(self);
    return;
  }

  if (nread == 0) {
    utp_issue_deferred_acks(self->context);
    return;
  }

  ret = utp_process_udp(self->context, (const unsigned char *) buf->base, nread, addr, sizeof(struct sockaddr));
  if (ret) return;

  // not a utp message -> call on_message
  if (!self->on_message) return;

  struct sockaddr_in *addr_in = (struct sockaddr_in *) addr;
  int port = ntohs(addr_in->sin_port);
  char ip[17];
  uv_ip4_name(addr_in, (char *) &ip, 17);
  self->on_message(self, buf->base, (size_t) nread, port, (char *) &ip);
}

static void
on_uv_interval (uv_timer_t *req) {
  utp_uv_t *self = (utp_uv_t *) req->data;
  utp_check_timeouts(self->context);
}

#ifdef UV_LEGACY
static uv_buf_t
on_uv_alloc_compat (uv_handle_t* handle, size_t suggested_size) {
  utp_uv_t *self = (utp_uv_t *) handle->data;
  return uv_buf_init(self->buffer, UTP_UV_BUFFER_SIZE);
}

static void
on_uv_read_compat (uv_udp_t* handle, ssize_t nread, uv_buf_t buf, struct sockaddr* addr, unsigned flags) {
  on_uv_read(handle, nread, &buf, addr, flags);
}

static void
on_uv_interval_compat (uv_timer_t *req, int status) {
  on_uv_interval(req);
}

static void
on_uv_send_compat (uv_udp_send_t* req, int status) {
  free(req->data);
  free(req);
}
#endif

static void
on_uv_send (uv_udp_send_t* req, int status) {
  uv_udp_t *handle = req->handle;
  utp_uv_t *self = (utp_uv_t *) handle->data;
  if (self->on_send) self->on_send(self, req, status);
}

static uint64
on_utp_read (utp_callback_arguments *a) {
  utp_uv_t *self = (utp_uv_t *) utp_context_get_userdata(a->context);
  if (self->on_socket_read) self->on_socket_read(self, a->socket, (char *) a->buf, a->len);
  utp_read_drained(a->socket);
  return 0;
}

static uint64
on_utp_state_change (utp_callback_arguments *a) {
  utp_uv_t *self = (utp_uv_t *) utp_context_get_userdata(a->context);

  switch (a->state) {
    case UTP_STATE_CONNECT:
      if (self->on_socket_connect) self->on_socket_connect(self, a->socket);
      break;

    case UTP_STATE_WRITABLE:
      if (self->on_socket_writable) self->on_socket_writable(self, a->socket);
      break;

    case UTP_STATE_EOF:
      if (self->on_socket_end) self->on_socket_end(self, a->socket);
      break;

    case UTP_STATE_DESTROYING:
      self->sockets--;
      if (!self->sockets && self->destroyed) really_destroy(self);
      if (self->on_socket_close) self->on_socket_close(self, a->socket);
      break;

    default:
      UTP_UV_DEBUG("unknown state change");
      break;
  }

  return 0;
}

static uint64
on_utp_log (utp_callback_arguments *a) {
  UTP_UV_DEBUG(a->buf);
  return 0;
}

static uint64
on_utp_accept (utp_callback_arguments *a) {
  utp_uv_t *self = (utp_uv_t *) utp_context_get_userdata(a->context);
  if (!self->on_socket) return 0;
  self->sockets++;
  self->on_socket(self, a->socket);
  return 0;
}

static uint64
on_utp_firewall (utp_callback_arguments *a) {
  utp_uv_t *self = (utp_uv_t *) utp_context_get_userdata(a->context);
  if (!self->on_socket || self->firewalled) return 1;
  if (self->max_sockets && self->sockets >= self->max_sockets) return 1;
  return 0;
}

static uint64
on_utp_sendto (utp_callback_arguments *a) {
  utp_uv_t *self = (utp_uv_t *) utp_context_get_userdata(a->context);

#ifdef UV_LEGACY
  uv_udp_send_t *req = (uv_udp_send_t *) malloc(sizeof(uv_udp_send_t));
  if (req == NULL) return 0;

  char *cpy = (char *) malloc(a->len);
  if (cpy == NULL) return 0;
  memcpy(cpy, a->buf, a->len);

  req->data = cpy;
  uv_buf_t buf = uv_buf_init(cpy, a->len);
  struct sockaddr_in *addr = (struct sockaddr_in *) a->address;
  uv_udp_send(req, &(self->handle), &buf, 1, *addr, on_uv_send_compat);
#else
  uv_buf_t buf = {
    .base = (char *) a->buf,
    .len = a->len
  };

  uv_udp_try_send(&(self->handle), &buf, 1, a->address);
#endif
  return 0;
}

static uint64
on_utp_error (utp_callback_arguments *a) {
  utp_uv_t *self = (utp_uv_t *) utp_context_get_userdata(a->context);
  utp_socket *socket = a->socket;
  if (self->on_socket_error) self->on_socket_error(self, socket, a->error_code);
  return 0;
}

int
utp_uv_init (utp_uv_t *self) {
  int ret;
  uv_udp_t *handle = &(self->handle);
  uv_timer_t *timer = &(self->timer);

  // clear state
  self->firewalled = 0;
  self->sockets = 0;
  self->max_sockets = 0;
  self->destroyed = 0;
  self->on_message = NULL;
  self->on_send = NULL;
  self->on_error = NULL;
  self->on_close = NULL;
  self->on_socket = NULL;
  self->on_socket_error = NULL;
  self->on_socket_read = NULL;
  self->on_socket_writable = NULL;
  self->on_socket_end = NULL;
  self->on_socket_close = NULL;
  self->on_socket_connect = NULL;

  // init utp
  self->context = utp_init(2);

  utp_context_set_userdata(self->context, self);

  utp_set_callback(self->context, UTP_ON_STATE_CHANGE, &on_utp_state_change);
  utp_set_callback(self->context, UTP_ON_READ, &on_utp_read);
  utp_set_callback(self->context, UTP_ON_FIREWALL, &on_utp_firewall);
  utp_set_callback(self->context, UTP_ON_ACCEPT, &on_utp_accept);
  utp_set_callback(self->context, UTP_SENDTO, &on_utp_sendto);
  utp_set_callback(self->context, UTP_ON_ERROR, &on_utp_error);

  ret = uv_timer_init(uv_default_loop(), timer);
  if (ret) return ret;

  ret = uv_udp_init(uv_default_loop(), handle);
  if (ret) return ret;

  handle->data = self;
  timer->data = self;

  return 0;
}

utp_socket_stats*
utp_uv_socket_stats (utp_uv_t *self, utp_socket *socket) {
  return utp_get_stats(socket);
}

utp_socket *
utp_uv_connect (utp_uv_t *self, int port, char *ip) {
  struct sockaddr_in addr;
  int ret;

#ifdef UV_LEGACY
  addr = uv_ip4_addr(UTP_UV_IP_STRING(ip), port);
#else
  ret = uv_ip4_addr(UTP_UV_IP_STRING(ip), port, &addr);
  if (ret) return NULL;
#endif

  utp_socket *socket = utp_create_socket(self->context);
  if (socket == NULL) return NULL;

  ret = utp_connect(socket, (struct sockaddr *) &addr, sizeof(struct sockaddr_in));
  if (ret) return NULL;

  self->sockets++;

  return socket;
}

void
utp_uv_debug (utp_uv_t *self) {
  utp_context_set_option(self->context, UTP_LOG_DEBUG, 1);
  utp_set_callback(self->context, UTP_LOG, &on_utp_log);
}

int
utp_uv_bind (utp_uv_t *self, int port, char *ip) {
  struct sockaddr_in addr;
  int ret;
  uv_udp_t *handle = &(self->handle);
  uv_timer_t *timer = &(self->timer);

#ifdef UV_LEGACY
  addr = uv_ip4_addr(UTP_UV_IP_STRING(ip), port);
#else
  ret = uv_ip4_addr(UTP_UV_IP_STRING(ip), port, &addr);
  if (ret) return ret;
#endif

#ifdef UV_LEGACY
  ret = uv_udp_bind(handle, addr, 0);
#else
  ret = uv_udp_bind(handle, (const struct sockaddr*) &addr, 0);
#endif
  if (ret) return ret;

#ifdef UV_LEGACY
  ret = uv_udp_recv_start(handle, on_uv_alloc_compat, on_uv_read_compat);
#else
  ret = uv_udp_recv_start(handle, on_uv_alloc, on_uv_read);
#endif
  if (ret) return ret;

#ifdef UV_LEGACY
  ret = uv_timer_start(timer, on_uv_interval_compat, UTP_UV_TIMEOUT_INTERVAL, UTP_UV_TIMEOUT_INTERVAL);
#else
  ret = uv_timer_start(timer, on_uv_interval, UTP_UV_TIMEOUT_INTERVAL, UTP_UV_TIMEOUT_INTERVAL);
#endif
  if (ret) return ret;

  return 0;
}

int
utp_uv_address (utp_uv_t *self, int *port, char *ip) {
  int ret;
  uv_udp_t *handle = &(self->handle);
  struct sockaddr name;
  int name_len = sizeof(name);

  ret = uv_udp_getsockname(handle, &name, &name_len);
  if (ret) return ret;

  struct sockaddr_in *name_in = (struct sockaddr_in *) &name;
  *port = ntohs(name_in->sin_port);
  if (ip != NULL) uv_ip4_name(name_in, ip, 17);

  return 0;
}

int
utp_uv_socket_writev (utp_uv_t *self, utp_socket *socket, struct utp_iovec *bufs, size_t bufs_len) {
  return utp_writev(socket, bufs, bufs_len);
}

int
utp_uv_socket_write (utp_uv_t *self, utp_socket *socket, char *data, size_t len) {
  return utp_write(socket, data, len);
}

void
utp_uv_socket_end (utp_uv_t *self, utp_socket *socket) {
  utp_close(socket);
}

void
utp_uv_ref (utp_uv_t *self) {
  uv_ref((uv_handle_t *) &(self->handle));
  uv_ref((uv_handle_t *) &(self->timer));
}

void
utp_uv_unref (utp_uv_t *self) {
  uv_unref((uv_handle_t *) &(self->handle));
  uv_unref((uv_handle_t *) &(self->timer));
}

void
utp_uv_destroy (utp_uv_t *self) {
  if (self->destroyed) return;
  self->destroyed = 1;
  self->on_socket = NULL;
  if (!self->sockets) really_destroy(self);
}

int
utp_uv_send (utp_uv_t *self, uv_udp_send_t* req, char *data, size_t len, int port, char *ip) {
  struct sockaddr_in addr;

  uv_udp_t *handle = &(self->handle);
#ifdef UV_LEGACY
  addr = uv_ip4_addr(UTP_UV_IP_STRING(ip), port);
#else
  int ret;
  ret = uv_ip4_addr(UTP_UV_IP_STRING(ip), port, &addr);
  if (ret) return -1;
#endif

  uv_buf_t buf = {
    .base = data,
    .len = len
  };

#ifdef UV_LEGACY
  return uv_udp_send(req, handle, &buf, 1, addr, on_uv_send);
#else
  return uv_udp_send(req, handle, &buf, 1, (const struct sockaddr *) &addr, on_uv_send);
#endif
}
