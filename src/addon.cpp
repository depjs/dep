#include <assert.h>
#include <napi.h>
#include "./test.cpp"

using namespace Napi;

Napi::Value Test(const CallbackInfo& info) {
  assert(info[0].IsArray());
  assert(info[1].IsArray());
  assert(info[2].IsArray());
  return Number::New(info.Env(), 0);
}

void Init(Env env, Object exports, Object module) {
	exports.Set("test", Function::New(env, Test));
}

NODE_API_MODULE(addon, Init);
