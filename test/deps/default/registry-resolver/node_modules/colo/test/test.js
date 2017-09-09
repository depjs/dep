var colo = require("../colo");
var assert = require("assert");

describe('colo', function(){
  describe("red", function(){
    it("should return 31m 39m", function(){
      assert.equal(colo.red("RED!"), "\u001b[31mRED!\u001b[39m");
    });
  });
  describe("bold", function(){
    it("should return 1m 22m", function(){
      assert.equal(colo.bold("BOLD!"), "\u001b[1mBOLD!\u001b[22m");
    });
  });
  describe("cyan and bold", function(){
    it("should return 1m 22m", function(){
      assert.equal(colo.cyan.bold("CYANBOLD!"), "\u001b[1m\u001b[36mCYANBOLD!\u001b[39m\u001b[22m");
    });
  });
  describe("cyan and red and bold", function(){
    it("should return 1m 22m", function(){
      assert.equal(colo.cyan.red.bold("CYANREDBOLD!"), "\u001b[1m\u001b[31m\u001b[36mCYANREDBOLD!\u001b[39m\u001b[39m\u001b[22m");
      console.log(colo.cyan.underline.bold("hoge"));
    });
  });
  describe("null", function(){
    it("should return print null", function(){
      assert.equal(colo.bold(null), "\u001b[1mnull\u001b[22m");
    });
  });
  describe("undefined", function(){
    it("should print undefined", function(){
      assert.equal(colo.cyan(undefined), "\u001b[36mundefined\u001b[39m");
    });
  });
});
