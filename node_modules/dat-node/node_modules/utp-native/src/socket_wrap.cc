#include "socket_wrap.h"

static Nan::Persistent<FunctionTemplate> socket_constructor;

SocketWrap::SocketWrap () {
  on_end = NULL;
  on_data = NULL;
  on_close = NULL;
  on_drain = NULL;
  on_error = NULL;
  on_connect = NULL;

  needs_drain = 0;
  first_read = 1;

  write_buffer = (struct utp_iovec *) malloc(16 * sizeof(struct utp_iovec));
  write_buffer_length = 16;
  write_buffer_used = 0;
  write_buffer_offset = 0;
}

SocketWrap::~SocketWrap () {
  if (on_end) delete on_end;
  if (on_data) delete on_data;
  if (on_close) delete on_close;
  if (on_drain) delete on_drain;
  if (on_error) delete on_error;
  if (on_connect) delete on_connect;

  free(write_buffer);
  context.Reset();
}

int
SocketWrap::Drain () {
  Nan::HandleScope scope;

  size_t len = this->write_buffer_used - this->write_buffer_offset;
  if (!len) return 0;

  struct utp_iovec *next = this->write_buffer + this->write_buffer_offset;
  int needs_drain = this->needs_drain;
  this->needs_drain = 0;

  int wrote = utp_uv_socket_writev(this->handle, this->socket, next, len);
  if (wrote < 0) return -1;

  size_t wrote_bytes = (size_t) wrote;

  while (wrote_bytes) {
    if (wrote_bytes >= next->iov_len) {
      wrote_bytes -= next->iov_len;
      this->write_buffer_offset++;
      next++;
    } else {
      char *base = (char *) next->iov_base;
      base += wrote_bytes;
      next->iov_base = base;
      next->iov_len -= wrote_bytes;
      wrote_bytes = 0;
    }
  }

  if (this->write_buffer_used == this->write_buffer_offset) {
    this->write_buffer_used = 0;
    this->write_buffer_offset = 0;
    if (needs_drain && this->on_drain) {
      Local<Object> ctx = Nan::New(this->context);
      this->on_drain->Call(ctx, 0, NULL);
    }
  } else {
    this->needs_drain = 1;
  }

  return 0;
}

int
SocketWrap::EnsureBuffer (int inc) {
  while (this->write_buffer_used + inc >= this->write_buffer_length) {
    size_t double_size = 2 * this->write_buffer_length * sizeof(struct utp_iovec);
    struct utp_iovec *bigger = (struct utp_iovec *) realloc(this->write_buffer, double_size);
    if (bigger == NULL) return 1;
    this->write_buffer_length *= 2;
    this->write_buffer = bigger;
  }
  return 0;
}

NAN_METHOD(SocketWrap::New) {
  SocketWrap* obj = new SocketWrap();
  obj->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(SocketWrap::Context) {
  SocketWrap *self = Nan::ObjectWrap::Unwrap<SocketWrap>(info.This());

  Local<Object> context = info[0]->ToObject();
  self->context.Reset(context);
}

NAN_METHOD(SocketWrap::Write) {
  SocketWrap *self = Nan::ObjectWrap::Unwrap<SocketWrap>(info.This());

  if (self->EnsureBuffer(1)) {
    Nan::ThrowError("Could not grow write buffer");
    return;
  }

  struct utp_iovec *holder = self->write_buffer + (self->write_buffer_used++);

  Local<Value> buffer = info[0]->ToObject();
  holder->iov_len = node::Buffer::Length(buffer);
  holder->iov_base = node::Buffer::Data(buffer);

  if (self->Drain()) {
    Nan::ThrowError("Write failed");
    return;
  }

  if (self->write_buffer_used == 0) info.GetReturnValue().Set(Nan::True());
  else info.GetReturnValue().Set(Nan::False());
}

NAN_METHOD(SocketWrap::Writev) {
  SocketWrap *self = Nan::ObjectWrap::Unwrap<SocketWrap>(info.This());

  Local<Array> writes = info[0].As<Array>();
  Local<Value> chunk = Nan::New<String>("chunk").ToLocalChecked();
  uint32_t length = writes->Length();

  if (self->EnsureBuffer((int) length)) {
    Nan::ThrowError("Could not grow write buffer");
    return;
  }

  struct utp_iovec *next = self->write_buffer + self->write_buffer_used;

  for (uint32_t i = 0; i < length; i++) {
    Local<Value> buffer = Nan::Get(writes->Get(i)->ToObject(), chunk).ToLocalChecked();

    next->iov_len = node::Buffer::Length(buffer);
    next->iov_base = node::Buffer::Data(buffer);

    next++;
    self->write_buffer_used++;
  }

  if (self->Drain()) {
    Nan::ThrowError("Write failed");
    return;
  }

  if (self->write_buffer_used == 0) info.GetReturnValue().Set(Nan::True());
  else info.GetReturnValue().Set(Nan::False());
}

NAN_METHOD(SocketWrap::End) {
  SocketWrap *self = Nan::ObjectWrap::Unwrap<SocketWrap>(info.This());
  utp_uv_socket_end(self->handle, self->socket);
}

NAN_METHOD(SocketWrap::OnData) {
  SocketWrap *self = Nan::ObjectWrap::Unwrap<SocketWrap>(info.This());
  self->on_data = new Nan::Callback(info[0].As<Function>());
}

NAN_METHOD(SocketWrap::OnEnd) {
  SocketWrap *self = Nan::ObjectWrap::Unwrap<SocketWrap>(info.This());
  self->on_end = new Nan::Callback(info[0].As<Function>());
}

NAN_METHOD(SocketWrap::OnClose) {
  SocketWrap *self = Nan::ObjectWrap::Unwrap<SocketWrap>(info.This());
  self->on_close = new Nan::Callback(info[0].As<Function>());
}

NAN_METHOD(SocketWrap::OnDrain) {
  SocketWrap *self = Nan::ObjectWrap::Unwrap<SocketWrap>(info.This());
  self->on_drain = new Nan::Callback(info[0].As<Function>());
}

NAN_METHOD(SocketWrap::OnError) {
  SocketWrap *self = Nan::ObjectWrap::Unwrap<SocketWrap>(info.This());
  self->on_error = new Nan::Callback(info[0].As<Function>());
}

NAN_METHOD(SocketWrap::OnConnect) {
  SocketWrap *self = Nan::ObjectWrap::Unwrap<SocketWrap>(info.This());
  self->on_connect = new Nan::Callback(info[0].As<Function>());
}

void SocketWrap::Init () {
  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(SocketWrap::New);
  socket_constructor.Reset(tpl);
  tpl->SetClassName(Nan::New("SocketWrap").ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Nan::SetPrototypeMethod(tpl, "context", SocketWrap::Context);
  Nan::SetPrototypeMethod(tpl, "write", SocketWrap::Write);
  Nan::SetPrototypeMethod(tpl, "writev", SocketWrap::Writev);
  Nan::SetPrototypeMethod(tpl, "end", SocketWrap::End);
  Nan::SetPrototypeMethod(tpl, "ondata", SocketWrap::OnData);
  Nan::SetPrototypeMethod(tpl, "onend", SocketWrap::OnEnd);
  Nan::SetPrototypeMethod(tpl, "onclose", SocketWrap::OnClose);
  Nan::SetPrototypeMethod(tpl, "ondrain", SocketWrap::OnDrain);
  Nan::SetPrototypeMethod(tpl, "onerror", SocketWrap::OnError);
  Nan::SetPrototypeMethod(tpl, "onconnect", SocketWrap::OnConnect);
}

Local<Value> SocketWrap::NewInstance () {
  Nan::EscapableHandleScope scope;

  Local<Object> instance;

  Local<FunctionTemplate> constructorHandle = Nan::New<FunctionTemplate>(socket_constructor);
  instance = Nan::NewInstance(constructorHandle->GetFunction()).ToLocalChecked();

  return scope.Escape(instance);
}
