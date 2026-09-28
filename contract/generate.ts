import { writeFileSync } from "node:fs";
import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { contract } from "./engine";
import { RESPONSE_EXAMPLES } from "./examples";

const generator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
});

type Spec = {
  paths: Record<
    string,
    Record<
      string,
      {
        responses: Record<
          string,
          { content?: Record<string, Record<string, unknown>> }
        >;
      }
    >
  >;
};

async function main() {
  const spec = (await generator.generate(contract, {
    info: {
      title: "musing 엔진 API",
      version: "0.1.0",
      description:
        "콘솔(서비스팀)과 엔진(엔진팀) 사이의 유일한 접점. 계약은 contract/engine.ts에 TypeScript로 정의하고 이 문서를 생성한다.",
    },
    servers: [{ url: "http://localhost:4000", description: "로컬 엔진" }],
  })) as unknown as Spec;

  for (const [path, method, examples] of RESPONSE_EXAMPLES) {
    const content = spec.paths[path]?.[method]?.responses?.["200"]?.content?.[
      "application/json"
    ];
    if (!content) throw new Error(`${method.toUpperCase()} ${path} 응답을 찾지 못했습니다`);
    content.examples = examples;
  }

  writeFileSync("contract/openapi.json", `${JSON.stringify(spec, null, 2)}\n`);
  console.log("contract/openapi.json 생성됨");
}

main();
