import { KVStore } from "../kv/store";

export async function handlePrerequisites(body: unknown, store: KVStore): Promise<object> {
  const { action, topic, prerequisites = [] } = body as {
    action: "add" | "remove" | "list";
    topic: string;
    prerequisites?: string[];
  };

  const topics = await store.getAllTopics();
  const found = topics.find(t => t.name === topic || t.id === topic);
  if (!found) return { error: `Topic "${topic}" not found` };

  switch (action) {
    case "add": {
      const existing = await store.getPrerequisites(found.id);
      const toAdd: string[] = [];
      const results: object[] = [];

      for (const p of prerequisites) {
        const prereq = topics.find(t => t.name === p || t.id === p);
        if (!prereq) { results.push({ prerequisite: p, status: "not_found" }); continue; }
        if (!existing.includes(prereq.id)) toAdd.push(prereq.id);
        results.push({ prerequisite: p, prerequisite_id: prereq.id, status: "added" });
      }

      if (toAdd.length > 0) {
        await store.setPrerequisites(found.id, [...existing, ...toAdd]);
      }
      return { action: "add", topic, results };
    }

    case "remove": {
      const existing = await store.getPrerequisites(found.id);
      const toRemove = new Set<string>();
      const results: object[] = [];

      for (const p of prerequisites) {
        const prereq = topics.find(t => t.name === p || t.id === p);
        if (!prereq) { results.push({ prerequisite: p, status: "not_found" }); continue; }
        toRemove.add(prereq.id);
        results.push({ prerequisite: p, status: "removed" });
      }

      await store.setPrerequisites(found.id, existing.filter(id => !toRemove.has(id)));
      return { action: "remove", topic, results };
    }

    case "list": {
      const prereqIds = await store.getPrerequisites(found.id);
      const prereqs = prereqIds.map(id => {
        const t = topics.find(x => x.id === id);
        return { id, name: t?.name ?? id };
      });
      return { action: "list", topic, topic_id: found.id, prerequisites: prereqs };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
