"use client";

import { useEffect } from "react";

/// layout.tsx의 <head> 스크립트는 문서가 파싱될 때 한 번만 data-theme을 심는다.
/// 오류 응답(<html id="__next_error__"> 셸)이나 하이드레이션 실패로 React가 문서를
/// 다시 만들면 그 값이 사라져 다크가 라이트로 돌아간다. 마운트 뒤에 한 번 더 맞춘다.
export function ThemeSync() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      const root = document.documentElement;
      if (saved && root.dataset.theme !== saved) root.dataset.theme = saved;
    } catch {
      /* 저장소를 못 읽으면 OS 설정을 따른다 */
    }
  }, []);
  return null;
}
