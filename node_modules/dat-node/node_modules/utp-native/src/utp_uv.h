#ifndef UTP_UV
#define UTP_UV

#include <uv.h>
#include "../deps/libutp/utp.h"

#define UTP_UV_BUFFER_SIZE 65536

typedef struct utp_uv {
  void *data;
  size_t sockets;
  size_t max_sockets;
  int destroyed;
  int firewalled;

  // uv
  uv_udp_t handle;
  uv_timer_t timer;
  char buffer[UTP_UV_BUFFER_SIZE];

  // utp
  utp_context *context;

  // callbacks
  void (*on_message) (struct utp_uv *self, char *data, size_t len, int port, char *ip);
  void (*on_send) (struct utp_uv *self, uv_udp_send_t *req, int status);
  void (*on_close) (struct utp_uv *self);
  void (*on_error) (struct utp_uv *self);

  void (*on_socket) (struct utp_uv *self, utp_socket *socket);
  void (*on_socket_error) (struct utp_uv *self, utp_socket *socket, int error);
  void (*on_socket_read) (struct utp_uv *self, utp_socket *socket, char *data, size_t len);
  void (*on_socket_writable) (struct utp_uv *self, utp_socket *socket);
  void (*on_socket_close) (struct utp_uv *self, utp_socket *socket);
  void (*on_socket_end) (struct utp_uv *self, utp_socket *socket);
  void (*on_socket_connect) (struct utp_uv *self, utp_socket *socket);
} utp_uv_t;

#define utp_uv_set_userdata(self, data) (self->data = (void *) data)
#define utp_uv_get_userdata(self) (self->data)

#define utp_uv_socket_set_userdata(socket, data) utp_set_userdata(socket, (void *) data)
#define utp_uv_socket_get_userdata(socket) utp_get_userdata(socket)

int
utp_uv_init (utp_uv_t *self);

void
utp_uv_destroy (utp_uv_t *self);

utp_socket_stats*
utp_uv_socket_stats (utp_uv_t *self, utp_socket *socket);

void
utp_uv_ref (utp_uv_t *self);

void
utp_uv_unref (utp_uv_t *self);

int
utp_uv_socket_write (utp_uv_t *self, utp_socket *socket, char *data, size_t len);

int
utp_uv_socket_writev (utp_uv_t *self, utp_socket *socket, struct utp_iovec *bufs, size_t bufs_len);

void
utp_uv_socket_end (utp_uv_t *self, utp_socket *socket);

utp_socket *
utp_uv_connect (utp_uv_t *self, int port, char *ip);

int
utp_uv_bind (utp_uv_t *self, int port, char *ip);

int
utp_uv_address (utp_uv_t *self, int *port, char *ip);

int
utp_uv_send (utp_uv_t *self, uv_udp_send_t* req, char *data, size_t len, int port, char *ip);

void
utp_uv_debug (utp_uv_t *self);

#endif
