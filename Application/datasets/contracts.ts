// Dataset schema contract: columns definitions (externalized for easy changes)

export const columnsAuctionEd = [
  { key: "address", header: "주소" },
  { key: "price", header: "낙찰가(만원)" },
  { key: "area", header: "면적(㎡)" },
  { key: "auctionDate", header: "매각기일" },
  { key: "bidCount", header: "입찰수" },
] as const;

export const columnsSale = [
  { key: "address", header: "주소" },
  { key: "price", header: "거래가(만원)" },
  { key: "area", header: "면적(㎡)" },
  { key: "transactionDate", header: "거래일" },
] as const;

export const columnsRent = [
  { key: "address", header: "주소" },
  { key: "price", header: "가격(만원, 환산)" },
  { key: "deposit", header: "보증금(만원)" },
  { key: "monthlyRent", header: "월세(만원)" },
  { key: "area", header: "면적(㎡)" },
] as const;

export const columnsListings = [
  { key: "address", header: "주소" },
  { key: "price", header: "가격(만원)" },
];
