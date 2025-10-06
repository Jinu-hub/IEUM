import type { CreateContentsInput } from "~/core/lib/types";
import type { UnifiedActivityDoc } from "../lib/types";
import { crossLinker } from "./cross-linker";
import { githubIngestor, slackIngestor } from "./ingestors";

export async function normalizeAndReduceData(input: CreateContentsInput) {

    // 1. 수집 & 정규화(Collect & Normalization)
    const githubData = await githubIngestor(input.githubResult || {});
    const slackData = await slackIngestor(input.slackResult || {});

    // 2. 중복 제거 & 연결(Deduplication & Linking)
    const linkedData = await crossLinker({ ...githubData, ...slackData } as UnifiedActivityDoc);
    //await saveContentToFile(linkedData, 'output-test', 'linked_', 'json');

    return linkedData;
}

/*
export async function analyzeData(input: CreateContentsInput, linkedData: LinkedActivityDoc): Promise<any> {

    // 3. github data를 기반으로 kpi snapshot을 생성
    const kpiInfo = await repoKpiExtractor(input.githubResult || {});

    // 4. slack data를 기반으로 topic clustering을 생성
    const topics = await topicClustering(linkedData);
    return { kpiInfo, topics };

}
*/

export async function generateContents(input: CreateContentsInput) {
    const linkedData = await normalizeAndReduceData(input);
    // const { kpiInfo, topics } = await analyzeData(input, linkedData);
    // await saveContentToFile(topics, 'output-test', 'topics_', 'json');
    return { linkedData, kpiInfo: null, topics: null };
}