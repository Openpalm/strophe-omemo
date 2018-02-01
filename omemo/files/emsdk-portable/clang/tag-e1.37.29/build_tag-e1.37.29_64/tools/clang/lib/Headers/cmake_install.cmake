# Install script for directory: /var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers

# Set the install prefix
if(NOT DEFINED CMAKE_INSTALL_PREFIX)
  set(CMAKE_INSTALL_PREFIX "/usr/local")
endif()
string(REGEX REPLACE "/$" "" CMAKE_INSTALL_PREFIX "${CMAKE_INSTALL_PREFIX}")

# Set the install configuration name.
if(NOT DEFINED CMAKE_INSTALL_CONFIG_NAME)
  if(BUILD_TYPE)
    string(REGEX REPLACE "^[^A-Za-z0-9_]+" ""
           CMAKE_INSTALL_CONFIG_NAME "${BUILD_TYPE}")
  else()
    set(CMAKE_INSTALL_CONFIG_NAME "Release")
  endif()
  message(STATUS "Install configuration: \"${CMAKE_INSTALL_CONFIG_NAME}\"")
endif()

# Set the component getting installed.
if(NOT CMAKE_INSTALL_COMPONENT)
  if(COMPONENT)
    message(STATUS "Install component: \"${COMPONENT}\"")
    set(CMAKE_INSTALL_COMPONENT "${COMPONENT}")
  else()
    set(CMAKE_INSTALL_COMPONENT)
  endif()
endif()

# Install shared libraries without execute permission?
if(NOT DEFINED CMAKE_INSTALL_SO_NO_EXE)
  set(CMAKE_INSTALL_SO_NO_EXE "1")
endif()

if(NOT CMAKE_INSTALL_COMPONENT OR "${CMAKE_INSTALL_COMPONENT}" STREQUAL "clang-headers")
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/lib/clang/4.0.0/include" TYPE FILE PERMISSIONS OWNER_READ OWNER_WRITE GROUP_READ WORLD_READ FILES
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/adxintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/altivec.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/ammintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/arm_acle.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/armintr.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/avx2intrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/avx512bwintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/avx512cdintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/avx512dqintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/avx512erintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/avx512fintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/avx512ifmaintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/avx512ifmavlintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/avx512pfintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/avx512vbmiintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/avx512vbmivlintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/avx512vlbwintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/avx512vlcdintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/avx512vldqintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/avx512vlintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/avxintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/bmi2intrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/bmiintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/__clang_cuda_builtin_vars.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/__clang_cuda_cmath.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/__clang_cuda_complex_builtins.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/__clang_cuda_intrinsics.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/__clang_cuda_math_forward_declares.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/__clang_cuda_runtime_wrapper.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/cpuid.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/clflushoptintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/emmintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/f16cintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/float.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/fma4intrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/fmaintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/fxsrintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/htmintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/htmxlintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/ia32intrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/immintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/intrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/inttypes.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/iso646.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/limits.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/lzcntintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/mm3dnow.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/mmintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/mm_malloc.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/module.modulemap"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/msa.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/mwaitxintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/nmmintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/opencl-c.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/pkuintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/pmmintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/popcntintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/prfchwintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/rdseedintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/rtmintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/s390intrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/shaintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/smmintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/stdalign.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/stdarg.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/stdatomic.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/stdbool.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/stddef.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/__stddef_max_align_t.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/stdint.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/stdnoreturn.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/tbmintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/tgmath.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/tmmintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/unwind.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/vadefs.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/varargs.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/vecintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/wmmintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/__wmmintrin_aes.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/__wmmintrin_pclmul.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/x86intrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/xmmintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/xopintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/xsavecintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/xsaveintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/xsaveoptintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/xsavesintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/xtestintrin.h"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/build_tag-e1.37.29_64/tools/clang/lib/Headers/arm_neon.h"
    )
endif()

if(NOT CMAKE_INSTALL_COMPONENT OR "${CMAKE_INSTALL_COMPONENT}" STREQUAL "clang-headers")
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/lib/clang/4.0.0/include/cuda_wrappers" TYPE FILE PERMISSIONS OWNER_READ OWNER_WRITE GROUP_READ WORLD_READ FILES
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/cuda_wrappers/algorithm"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/cuda_wrappers/complex"
    "/var/www/development/omemo/files/emsdk-portable/clang/tag-e1.37.29/src/tools/clang/lib/Headers/cuda_wrappers/new"
    )
endif()

