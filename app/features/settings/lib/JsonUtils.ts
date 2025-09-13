

  // metaJson 파싱 헬퍼 함수
  export const parseMetaJson = (metaJson: any) => {
    if (typeof metaJson === 'string') {
      try {
        return JSON.parse(metaJson);
      } catch {
        return { source: 'manual', tags: [] };
      }
    }
    return metaJson || { source: 'manual', tags: [] };
  };