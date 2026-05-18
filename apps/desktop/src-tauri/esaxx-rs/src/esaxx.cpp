#include "esa.hxx"

extern "C"{

int esaxx_int32(char32_t* T, int32_t* SA, int32_t* L, int32_t* R, int32_t* D,
     int32_t n, int32_t k, int32_t &nodeNum) {

    return esaxx(T, SA, L, R, D, n, k, nodeNum);
}
}
