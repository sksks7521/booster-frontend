type Params = { params: { id: string } };

export default function Head({ params }: Params) {
  const id = params?.id;
  const title = `분석 상세 · ${id}`;
  const description = "데이터 기반 리포트와 비교 분석 결과를 확인하세요.";
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={`/analysis/${id}`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:card" content="summary_large_image" />
    </>
  );
}


