#include <nan.h>
#include "src/utp_wrap.h"
#include "src/socket_wrap.h"

NAN_METHOD(UTP) {
  info.GetReturnValue().Set(UTPWrap::NewInstance());
}

NAN_MODULE_INIT(InitAll) {
  UTPWrap::Init();
  SocketWrap::Init();
  Nan::Set(target, Nan::New<String>("utp").ToLocalChecked(), Nan::GetFunction(Nan::New<FunctionTemplate>(UTP)).ToLocalChecked());
}

NODE_MODULE(utp, InitAll)
