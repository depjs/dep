#ifndef SOCKET_WRAP_H
#define SOCKET_WRAP_H

#include <nan.h>
#include "utp_uv.h"

using namespace v8;

class SocketWrap : public Nan::ObjectWrap {
public:
  Nan::Callback *on_data;
  Nan::Callback *on_end;
  Nan::Callback *on_close;
  Nan::Callback *on_drain;
  Nan::Callback *on_error;
  Nan::Callback *on_connect;

  Nan::Persistent<Object> context;

  utp_uv_t *handle;
  utp_socket *socket;
  int first_read;

  struct utp_iovec *write_buffer;
  size_t write_buffer_offset;
  size_t write_buffer_used;
  size_t write_buffer_length;

  static void Init ();
  static Local<Value> NewInstance ();
  int Drain();
  int EnsureBuffer(int inc);
  SocketWrap ();
  ~SocketWrap ();

private:
  int needs_drain;

  static NAN_METHOD(New);
  static NAN_METHOD(Context);
  static NAN_METHOD(End);
  static NAN_METHOD(Write);
  static NAN_METHOD(Writev);
  static NAN_METHOD(OnData);
  static NAN_METHOD(OnEnd);
  static NAN_METHOD(OnError);
  static NAN_METHOD(OnClose);
  static NAN_METHOD(OnConnect);
  static NAN_METHOD(OnDrain);
};

#endif
