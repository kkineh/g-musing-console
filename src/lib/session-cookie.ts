/// 미들웨어(Edge)와 서버 코드가 함께 쓰는 값이다. Edge 번들에 node:crypto나
/// Prisma가 섞이지 않도록 auth.ts에서 떼어 둔다.
export const SESSION_COOKIE = "musing_session";
