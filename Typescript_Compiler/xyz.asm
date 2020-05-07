default rel
section .text
global main
main:
mov rax, __float64__(1.000000000000000)
push rax
mov rax, __float64__(2.000000000000000)
push rax
; START FLOAT MATH
movq xmm1, [rsp]
add rsp, 8
movq xmm0, [rsp]
add rsp, 8
addsd xmm0, xmm1
sub rsp, 8
movq [rsp], xmm0
; END FLOAT MATH
mov rax, __float64__(3.000000000000000)
push rax
; START FLOAT MATH
movq xmm1, [rsp]
add rsp, 8
movq xmm0, [rsp]
add rsp, 8
subsd xmm0, xmm1
sub rsp, 8
movq [rsp], xmm0
; END FLOAT MATH
pop rax
cmp rax, 0
je lbl0
; If section
push qword 4
pop rax
ret
jmp lbl1
lbl0:
; Else section
push qword 5
pop rax
ret
lbl1:
; End cond
ret
section .data