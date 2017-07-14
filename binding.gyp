{
  "targets": [
    {
      "target_name": "addon",
	  "include_dirs": ["<!@(node -p \"require('node-addon-api').include\")"],
	  "dependencies": ["<!(node -p \"require('node-addon-api').gyp\")"],
	  "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
      "sources": [
		"src/addon.cpp"
	  ]
    }
  ]
}
