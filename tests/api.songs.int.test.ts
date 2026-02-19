import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET as listSongs, POST as createSong } from "@/app/api/songs/route";
import {
  GET as getSong,
  PUT as updateSong,
  DELETE as deleteSong,
} from "@/app/api/songs/[id]/route";

const ADMIN_HEADERS = {
  "content-type": "application/json",
  "x-test-admin": process.env.TEST_ADMIN_TOKEN ?? "test-admin-token",
};

describe("API songs (integration minimal)", () => {
  it("CRUD create/get/update/delete", async () => {
    const lib = await prisma.library.findFirst({ select: { id: true } });
    if (!lib) throw new Error("No library in test DB - run seed first");

    // Create
    const title = `Test Song ${Date.now()}`;
    const createRes = await createSong(
      new Request("http://test.local/api/songs", {
        method: "POST",
        headers: ADMIN_HEADERS,
        body: JSON.stringify({
          libraryId: lib.id,
          title,
          artist: "Tester",
          tags: ["test", "mvp"],
          chordproText: "[Am]Bonjour",
        }),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { id: string; title: string };
    expect(created.id).toBeTruthy();
    expect(created.title).toBe(title);

    const id = created.id;

    try {
      // Get
      const getRes = await getSong(new Request("http://test.local/api/songs/" + id, { headers: ADMIN_HEADERS }), {
        params: { id },
      });
      expect(getRes.status).toBe(200);
      const got = (await getRes.json()) as { id: string; chordproText: string };
      expect(got.id).toBe(id);
      expect(got.chordproText).toContain("Bonjour");

      // Update
      const putRes = await updateSong(
        new Request("http://test.local/api/songs/" + id, {
          method: "PUT",
          headers: ADMIN_HEADERS,
          body: JSON.stringify({ title: title + " Updated" }),
        }),
        { params: { id } },
      );
      expect(putRes.status).toBe(200);
      const updated = (await putRes.json()) as { title: string };
      expect(updated.title).toBe(title + " Updated");

      // List includes
      const listRes = await listSongs(new Request(`http://test.local/api/songs?libraryId=${lib.id}&query=Updated`, { headers: ADMIN_HEADERS }));
      expect(listRes.status).toBe(200);
      const listed = (await listRes.json()) as { items: Array<{ id: string }> };
      expect(listed.items.some((s) => s.id === id)).toBe(true);

      // Delete
      const delRes = await deleteSong(new Request("http://test.local/api/songs/" + id, { method: "DELETE", headers: ADMIN_HEADERS }), {
        params: { id },
      });
      expect(delRes.status).toBe(204);

      // Get after delete => 404
      const getRes2 = await getSong(new Request("http://test.local/api/songs/" + id, { headers: ADMIN_HEADERS }), {
        params: { id },
      });
      expect(getRes2.status).toBe(404);
    } finally {
      // Cleanup if something failed mid-test
      await prisma.song.deleteMany({ where: { id } }).catch(() => {});
    }
  });
});

