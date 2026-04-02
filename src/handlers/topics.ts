import { KVStore } from "../kv/store";
import type { TopicRecord } from "../kv/types";

export async function handleTopics(body: unknown, store: KVStore): Promise<object> {
  const { action, id, name, parent_id, path, merge_into } = body as {
    action: "list" | "add" | "rename" | "move" | "delete" | "merge";
    id?: string;
    name?: string;
    parent_id?: string | null;
    path?: string;
    merge_into?: string;
  };

  switch (action) {
    case "list": {
      const all = await store.getAllTopics();
      return buildTree(all, id ?? null);
    }

    case "add": {
      if (path) {
        const topicId = await store.resolveTopicPath(path);
        const topic = await store.getTopic(topicId);
        return { action: "add", topic };
      }
      if (!name) throw new Error("name is required for add action");
      const newTopic: TopicRecord = {
        id: crypto.randomUUID(),
        name,
        parentId: parent_id ?? null,
        createdAt: Math.floor(Date.now() / 1000),
      };
      await store.putTopic(newTopic);
      return { action: "add", topic: newTopic };
    }

    case "rename": {
      if (!id || !name) throw new Error("id and name are required for rename");
      const existing = await store.getTopic(id);
      if (!existing) throw new Error(`Topic ${id} not found`);
      await store.putTopic({ ...existing, name });
      return { action: "rename", topic_id: id, new_name: name };
    }

    case "move": {
      if (!id) throw new Error("id is required for move");
      const existing = await store.getTopic(id);
      if (!existing) throw new Error(`Topic ${id} not found`);
      await store.putTopic({ ...existing, parentId: parent_id ?? null });
      return { action: "move", topic_id: id, new_parent_id: parent_id ?? null };
    }

    case "delete": {
      if (!id) throw new Error("id is required for delete");
      await store.deleteTopic(id);
      return { action: "delete", deleted_id: id };
    }

    case "merge": {
      if (!id || !merge_into) throw new Error("id and merge_into are required for merge");
      // 把被合并主题的子节点移到目标
      const all = await store.getAllTopics();
      const children = all.filter(t => t.parentId === id);
      await Promise.all(children.map(c => store.putTopic({ ...c, parentId: merge_into })));
      await store.deleteTopic(id);
      return { action: "merge", merged_from: id, merged_into: merge_into };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

function buildTree(topics: TopicRecord[], parentFilter: string | null): object {
  interface Node extends TopicRecord { children: Node[] }
  const map = new Map<string, Node>();
  const roots: Node[] = [];

  for (const t of topics) {
    map.set(t.id, { ...t, children: [] });
  }
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  if (parentFilter && map.has(parentFilter)) {
    return { action: "list", topics: [map.get(parentFilter)] };
  }
  return { action: "list", topics: roots };
}
