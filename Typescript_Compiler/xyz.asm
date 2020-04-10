%include "doCall.asm"
default rel
section .text
global main
main:
mov arg0, 0
mov arg1, string_r
ffcall fdopen
mov[stdin], rax
mov arg0, 1
mov arg1, string_w
ffcall fdopen
mov[stdout], rax
; Starting PRINT
push qword 456
pop arg1
mov arg0, string_percent_d
ffvcall printf, 0
mov arg0, 0
ffcall fflush
; Ending PRINT
mov arg0, fgets_buffer
mov arg1, 64
mov arg2, [stdin]
ffcall fgets
mov arg0, fgets_buffer
mov arg1, 0
mov arg2, 10
ffcall strtol
push qword 123
pop rax
ret
ret
section .data
stdin: dq 0
stdout: dq 0
string_r: db 'r', 0
string_w: db 'w', 0
string_a: db 'a', 0
string_rplus: db 'r+', 0
string_percent_s: db '%s', 0
string_percent_d: db '%d', 0
fgets_buffer: times 64 db 0