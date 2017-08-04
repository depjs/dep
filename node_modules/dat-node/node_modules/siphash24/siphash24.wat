(module
  (memory (export "memory") 10 10)

  (func (export "siphash") (param $ptr i32) (param $ptr_len i32)
    (local $v0 i64)
    (local $v1 i64)
    (local $v2 i64)
    (local $v3 i64)
    (local $b i64)
    (local $k0 i64)
    (local $k1 i64)
    (local $m i64)
    (local $end i32)
    (local $left i32)

    (set_local $v0 (i64.const 0x736f6d6570736575))
    (set_local $v1 (i64.const 0x646f72616e646f6d))
    (set_local $v2 (i64.const 0x6c7967656e657261))
    (set_local $v3 (i64.const 0x7465646279746573))

    (set_local $k0 (i64.load (i32.const 8)))
    (set_local $k1 (i64.load (i32.const 16)))

    ;; b = ((uint64_t) inlen) << 56;
    (set_local $b (i64.shl (i64.extend_u/i32 (get_local $ptr_len)) (i64.const 56)))

    ;; left = inlen & 7;
    (set_local $left (i32.and (get_local $ptr_len) (i32.const 7)))

    ;; end = in + inlen - left;
    (set_local $end (i32.sub (i32.add (get_local $ptr) (get_local $ptr_len)) (get_local $left)))

    ;; v3 ^= k1;
    (set_local $v3 (i64.xor (get_local $v3) (get_local $k1)))

    ;; v2 ^= k0;
    (set_local $v2 (i64.xor (get_local $v2) (get_local $k0)))

    ;; v1 ^= k1;
    (set_local $v1 (i64.xor (get_local $v1) (get_local $k1)))

    ;; v0 ^= k0;
    (set_local $v0 (i64.xor (get_local $v0) (get_local $k0)))

    (block $end_loop
      (loop $start_loop
        (br_if $end_loop (i32.eq (get_local $ptr) (get_local $end)))

        ;; m = LOAD64_LE(in);
        (set_local $m (i64.load (get_local $ptr)))

        ;; v3 ^= m
        (set_local $v3 (i64.xor (get_local $v3) (get_local $m)))

        ;; SIPROUND
        ;; v0 += v1;
        (set_local $v0 (i64.add (get_local $v0) (get_local $v1)))
        ;; v1 = ROTL64(v1, 13);
        (set_local $v1 (i64.rotl (get_local $v1) (i64.const 13)))
        ;; v1 ^= v0;
        (set_local $v1 (i64.xor (get_local $v1) (get_local $v0)))
        ;; v0 = ROTL64(v0, 32)
        (set_local $v0 (i64.rotl (get_local $v0) (i64.const 32)))
        ;; v2 += v3;
        (set_local $v2 (i64.add (get_local $v2) (get_local $v3)))
        ;; v3 = ROTL64(v3, 16);
        (set_local $v3 (i64.rotl (get_local $v3) (i64.const 16)))
        ;; v3 ^= v2;
        (set_local $v3 (i64.xor (get_local $v3) (get_local $v2)))
        ;; v0 += v3;
        (set_local $v0 (i64.add (get_local $v0) (get_local $v3)))
        ;; v3 = ROTL64(v3, 21);
        (set_local $v3 (i64.rotl (get_local $v3) (i64.const 21)))
        ;; v3 ^= v0;
        (set_local $v3 (i64.xor (get_local $v3) (get_local $v0)))
        ;; v2 += v1;
        (set_local $v2 (i64.add (get_local $v2) (get_local $v1)))
        ;; v1 = ROTL64(v1, 17);
        (set_local $v1 (i64.rotl (get_local $v1) (i64.const 17)))
        ;; v1 ^= v2;
        (set_local $v1 (i64.xor (get_local $v1) (get_local $v2)))
        ;; v2 = ROTL64(v2, 32);
        (set_local $v2 (i64.rotl (get_local $v2) (i64.const 32)))

        ;; SIPROUND
        ;; v0 += v1;
        (set_local $v0 (i64.add (get_local $v0) (get_local $v1)))
        ;; v1 = ROTL64(v1, 13);
        (set_local $v1 (i64.rotl (get_local $v1) (i64.const 13)))
        ;; v1 ^= v0;
        (set_local $v1 (i64.xor (get_local $v1) (get_local $v0)))
        ;; v0 = ROTL64(v0, 32)
        (set_local $v0 (i64.rotl (get_local $v0) (i64.const 32)))
        ;; v2 += v3;
        (set_local $v2 (i64.add (get_local $v2) (get_local $v3)))
        ;; v3 = ROTL64(v3, 16);
        (set_local $v3 (i64.rotl (get_local $v3) (i64.const 16)))
        ;; v3 ^= v2;
        (set_local $v3 (i64.xor (get_local $v3) (get_local $v2)))
        ;; v0 += v3;
        (set_local $v0 (i64.add (get_local $v0) (get_local $v3)))
        ;; v3 = ROTL64(v3, 21);
        (set_local $v3 (i64.rotl (get_local $v3) (i64.const 21)))
        ;; v3 ^= v0;
        (set_local $v3 (i64.xor (get_local $v3) (get_local $v0)))
        ;; v2 += v1;
        (set_local $v2 (i64.add (get_local $v2) (get_local $v1)))
        ;; v1 = ROTL64(v1, 17);
        (set_local $v1 (i64.rotl (get_local $v1) (i64.const 17)))
        ;; v1 ^= v2;
        (set_local $v1 (i64.xor (get_local $v1) (get_local $v2)))
        ;; v2 = ROTL64(v2, 32);
        (set_local $v2 (i64.rotl (get_local $v2) (i64.const 32)))

        ;; v0 ^= m;
        (set_local $v0 (i64.xor (get_local $v0) (get_local $m)))

        ;; ptr += 8
        (set_local $ptr (i32.add (get_local $ptr) (i32.const 8)))
        (br $start_loop)
      )
    )

    (block $0
      (block $1
        (block $2
          (block $3
            (block $4
              (block $5
                (block $6
                  (block $7
                    (br_table $0 $1 $2 $3 $4 $5 $6 $7 (get_local $left))
                  )
                  ;; b |= ((uint64_t) in[6]) << 48;
                  (set_local $b (i64.or (get_local $b) (i64.shl (i64.load8_u (i32.add (get_local $ptr) (i32.const 6))) (i64.const 48))))
                )
                ;; b |= ((uint64_t) in[5]) << 40;
                (set_local $b (i64.or (get_local $b) (i64.shl (i64.load8_u (i32.add (get_local $ptr) (i32.const 5))) (i64.const 40))))
              )
              ;; b |= ((uint64_t) in[4]) << 32;
              (set_local $b (i64.or (get_local $b) (i64.shl (i64.load8_u (i32.add (get_local $ptr) (i32.const 4))) (i64.const 32))))
            )
            ;; b |= ((uint64_t) in[3]) << 24;
            (set_local $b (i64.or (get_local $b) (i64.shl (i64.load8_u (i32.add (get_local $ptr) (i32.const 3))) (i64.const 24))))
          )
          ;; b |= ((uint64_t) in[2]) << 16;
          (set_local $b (i64.or (get_local $b) (i64.shl (i64.load8_u (i32.add (get_local $ptr) (i32.const 2))) (i64.const 16))))
        )
        ;; b |= ((uint64_t) in[1]) << 8;
        (set_local $b (i64.or (get_local $b) (i64.shl (i64.load8_u (i32.add (get_local $ptr) (i32.const 1))) (i64.const 8))))
      )
      ;; b |= ((uint64_t) in[0]);
      (set_local $b (i64.or (get_local $b) (i64.load8_u (get_local $ptr))))
    )

    ;; v3 ^= b;
    (set_local $v3 (i64.xor (get_local $v3) (get_local $b)))

    ;; SIPROUND
    ;; v0 += v1;
    (set_local $v0 (i64.add (get_local $v0) (get_local $v1)))
    ;; v1 = ROTL64(v1, 13);
    (set_local $v1 (i64.rotl (get_local $v1) (i64.const 13)))
    ;; v1 ^= v0;
    (set_local $v1 (i64.xor (get_local $v1) (get_local $v0)))
    ;; v0 = ROTL64(v0, 32)
    (set_local $v0 (i64.rotl (get_local $v0) (i64.const 32)))
    ;; v2 += v3;
    (set_local $v2 (i64.add (get_local $v2) (get_local $v3)))
    ;; v3 = ROTL64(v3, 16);
    (set_local $v3 (i64.rotl (get_local $v3) (i64.const 16)))
    ;; v3 ^= v2;
    (set_local $v3 (i64.xor (get_local $v3) (get_local $v2)))
    ;; v0 += v3;
    (set_local $v0 (i64.add (get_local $v0) (get_local $v3)))
    ;; v3 = ROTL64(v3, 21);
    (set_local $v3 (i64.rotl (get_local $v3) (i64.const 21)))
    ;; v3 ^= v0;
    (set_local $v3 (i64.xor (get_local $v3) (get_local $v0)))
    ;; v2 += v1;
    (set_local $v2 (i64.add (get_local $v2) (get_local $v1)))
    ;; v1 = ROTL64(v1, 17);
    (set_local $v1 (i64.rotl (get_local $v1) (i64.const 17)))
    ;; v1 ^= v2;
    (set_local $v1 (i64.xor (get_local $v1) (get_local $v2)))
    ;; v2 = ROTL64(v2, 32);
    (set_local $v2 (i64.rotl (get_local $v2) (i64.const 32)))

    ;; SIPROUND
    ;; v0 += v1;
    (set_local $v0 (i64.add (get_local $v0) (get_local $v1)))
    ;; v1 = ROTL64(v1, 13);
    (set_local $v1 (i64.rotl (get_local $v1) (i64.const 13)))
    ;; v1 ^= v0;
    (set_local $v1 (i64.xor (get_local $v1) (get_local $v0)))
    ;; v0 = ROTL64(v0, 32)
    (set_local $v0 (i64.rotl (get_local $v0) (i64.const 32)))
    ;; v2 += v3;
    (set_local $v2 (i64.add (get_local $v2) (get_local $v3)))
    ;; v3 = ROTL64(v3, 16);
    (set_local $v3 (i64.rotl (get_local $v3) (i64.const 16)))
    ;; v3 ^= v2;
    (set_local $v3 (i64.xor (get_local $v3) (get_local $v2)))
    ;; v0 += v3;
    (set_local $v0 (i64.add (get_local $v0) (get_local $v3)))
    ;; v3 = ROTL64(v3, 21);
    (set_local $v3 (i64.rotl (get_local $v3) (i64.const 21)))
    ;; v3 ^= v0;
    (set_local $v3 (i64.xor (get_local $v3) (get_local $v0)))
    ;; v2 += v1;
    (set_local $v2 (i64.add (get_local $v2) (get_local $v1)))
    ;; v1 = ROTL64(v1, 17);
    (set_local $v1 (i64.rotl (get_local $v1) (i64.const 17)))
    ;; v1 ^= v2;
    (set_local $v1 (i64.xor (get_local $v1) (get_local $v2)))
    ;; v2 = ROTL64(v2, 32);
    (set_local $v2 (i64.rotl (get_local $v2) (i64.const 32)))

    ;; v0 ^= b;
    (set_local $v0 (i64.xor (get_local $v0) (get_local $b)))

    ;; v2 ^= 0xff;
    (set_local $v2 (i64.xor (get_local $v2) (i64.const 0xff)))

    ;; SIPROUND
    ;; v0 += v1;
    (set_local $v0 (i64.add (get_local $v0) (get_local $v1)))
    ;; v1 = ROTL64(v1, 13);
    (set_local $v1 (i64.rotl (get_local $v1) (i64.const 13)))
    ;; v1 ^= v0;
    (set_local $v1 (i64.xor (get_local $v1) (get_local $v0)))
    ;; v0 = ROTL64(v0, 32)
    (set_local $v0 (i64.rotl (get_local $v0) (i64.const 32)))
    ;; v2 += v3;
    (set_local $v2 (i64.add (get_local $v2) (get_local $v3)))
    ;; v3 = ROTL64(v3, 16);
    (set_local $v3 (i64.rotl (get_local $v3) (i64.const 16)))
    ;; v3 ^= v2;
    (set_local $v3 (i64.xor (get_local $v3) (get_local $v2)))
    ;; v0 += v3;
    (set_local $v0 (i64.add (get_local $v0) (get_local $v3)))
    ;; v3 = ROTL64(v3, 21);
    (set_local $v3 (i64.rotl (get_local $v3) (i64.const 21)))
    ;; v3 ^= v0;
    (set_local $v3 (i64.xor (get_local $v3) (get_local $v0)))
    ;; v2 += v1;
    (set_local $v2 (i64.add (get_local $v2) (get_local $v1)))
    ;; v1 = ROTL64(v1, 17);
    (set_local $v1 (i64.rotl (get_local $v1) (i64.const 17)))
    ;; v1 ^= v2;
    (set_local $v1 (i64.xor (get_local $v1) (get_local $v2)))
    ;; v2 = ROTL64(v2, 32);
    (set_local $v2 (i64.rotl (get_local $v2) (i64.const 32)))

    ;; SIPROUND
    ;; v0 += v1;
    (set_local $v0 (i64.add (get_local $v0) (get_local $v1)))
    ;; v1 = ROTL64(v1, 13);
    (set_local $v1 (i64.rotl (get_local $v1) (i64.const 13)))
    ;; v1 ^= v0;
    (set_local $v1 (i64.xor (get_local $v1) (get_local $v0)))
    ;; v0 = ROTL64(v0, 32)
    (set_local $v0 (i64.rotl (get_local $v0) (i64.const 32)))
    ;; v2 += v3;
    (set_local $v2 (i64.add (get_local $v2) (get_local $v3)))
    ;; v3 = ROTL64(v3, 16);
    (set_local $v3 (i64.rotl (get_local $v3) (i64.const 16)))
    ;; v3 ^= v2;
    (set_local $v3 (i64.xor (get_local $v3) (get_local $v2)))
    ;; v0 += v3;
    (set_local $v0 (i64.add (get_local $v0) (get_local $v3)))
    ;; v3 = ROTL64(v3, 21);
    (set_local $v3 (i64.rotl (get_local $v3) (i64.const 21)))
    ;; v3 ^= v0;
    (set_local $v3 (i64.xor (get_local $v3) (get_local $v0)))
    ;; v2 += v1;
    (set_local $v2 (i64.add (get_local $v2) (get_local $v1)))
    ;; v1 = ROTL64(v1, 17);
    (set_local $v1 (i64.rotl (get_local $v1) (i64.const 17)))
    ;; v1 ^= v2;
    (set_local $v1 (i64.xor (get_local $v1) (get_local $v2)))
    ;; v2 = ROTL64(v2, 32);
    (set_local $v2 (i64.rotl (get_local $v2) (i64.const 32)))

    ;; SIPROUND
    ;; v0 += v1;
    (set_local $v0 (i64.add (get_local $v0) (get_local $v1)))
    ;; v1 = ROTL64(v1, 13);
    (set_local $v1 (i64.rotl (get_local $v1) (i64.const 13)))
    ;; v1 ^= v0;
    (set_local $v1 (i64.xor (get_local $v1) (get_local $v0)))
    ;; v0 = ROTL64(v0, 32)
    (set_local $v0 (i64.rotl (get_local $v0) (i64.const 32)))
    ;; v2 += v3;
    (set_local $v2 (i64.add (get_local $v2) (get_local $v3)))
    ;; v3 = ROTL64(v3, 16);
    (set_local $v3 (i64.rotl (get_local $v3) (i64.const 16)))
    ;; v3 ^= v2;
    (set_local $v3 (i64.xor (get_local $v3) (get_local $v2)))
    ;; v0 += v3;
    (set_local $v0 (i64.add (get_local $v0) (get_local $v3)))
    ;; v3 = ROTL64(v3, 21);
    (set_local $v3 (i64.rotl (get_local $v3) (i64.const 21)))
    ;; v3 ^= v0;
    (set_local $v3 (i64.xor (get_local $v3) (get_local $v0)))
    ;; v2 += v1;
    (set_local $v2 (i64.add (get_local $v2) (get_local $v1)))
    ;; v1 = ROTL64(v1, 17);
    (set_local $v1 (i64.rotl (get_local $v1) (i64.const 17)))
    ;; v1 ^= v2;
    (set_local $v1 (i64.xor (get_local $v1) (get_local $v2)))
    ;; v2 = ROTL64(v2, 32);
    (set_local $v2 (i64.rotl (get_local $v2) (i64.const 32)))

    ;; SIPROUND
    ;; v0 += v1;
    (set_local $v0 (i64.add (get_local $v0) (get_local $v1)))
    ;; v1 = ROTL64(v1, 13);
    (set_local $v1 (i64.rotl (get_local $v1) (i64.const 13)))
    ;; v1 ^= v0;
    (set_local $v1 (i64.xor (get_local $v1) (get_local $v0)))
    ;; v0 = ROTL64(v0, 32)
    (set_local $v0 (i64.rotl (get_local $v0) (i64.const 32)))
    ;; v2 += v3;
    (set_local $v2 (i64.add (get_local $v2) (get_local $v3)))
    ;; v3 = ROTL64(v3, 16);
    (set_local $v3 (i64.rotl (get_local $v3) (i64.const 16)))
    ;; v3 ^= v2;
    (set_local $v3 (i64.xor (get_local $v3) (get_local $v2)))
    ;; v0 += v3;
    (set_local $v0 (i64.add (get_local $v0) (get_local $v3)))
    ;; v3 = ROTL64(v3, 21);
    (set_local $v3 (i64.rotl (get_local $v3) (i64.const 21)))
    ;; v3 ^= v0;
    (set_local $v3 (i64.xor (get_local $v3) (get_local $v0)))
    ;; v2 += v1;
    (set_local $v2 (i64.add (get_local $v2) (get_local $v1)))
    ;; v1 = ROTL64(v1, 17);
    (set_local $v1 (i64.rotl (get_local $v1) (i64.const 17)))
    ;; v1 ^= v2;
    (set_local $v1 (i64.xor (get_local $v1) (get_local $v2)))
    ;; v2 = ROTL64(v2, 32);
    (set_local $v2 (i64.rotl (get_local $v2) (i64.const 32)))

    ;; b = v0 ^ v1 ^ v2 ^ v3;
    (i64.store (i32.const 0) (i64.xor (get_local $v0) (i64.xor (get_local $v1) (i64.xor (get_local $v2) (get_local $v3)))))
  )
)
