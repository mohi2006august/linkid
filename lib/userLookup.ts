import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import type { Link } from "@prisma/client";

/**
 * Transforms a flat list of links into a nested structure.
 * Groups (isGroup=true) get a `children` array of their child links.
 * Top-level links (parentId=null) without isGroup remain unchanged.
 */
function nestLinks(links: Link[]): (Link & { children?: Link[] })[] {
    const childrenMap = new Map<string, Link[]>();
    const topLevel: Link[] = [];

    for (const link of links) {
        if (link.parentId) {
            const siblings = childrenMap.get(link.parentId) || [];
            siblings.push(link);
            childrenMap.set(link.parentId, siblings);
        } else {
            topLevel.push(link);
        }
    }

    return topLevel.map(link => {
        if (link.isGroup) {
            return { ...link, children: childrenMap.get(link.id) || [] };
        }
        return link;
    });
}


export const resolveUserByUsername = unstable_cache(
    async (username: string) => {
        const exactUser = await prisma.user.findUnique({
            where: { username },
            include: { links: { where: { isPublic: true }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] } },
        });

        if (exactUser) {
            return { user: { ...exactUser, links: nestLinks(exactUser.links) }, canonicalUsername: exactUser.username ?? username };
        }

        const alias = await prisma.userAlias.findUnique({
            where: { username },
        });

        if (!alias) {
            return null;
        }

        const user = await prisma.user.findUnique({
            where: { id: alias.userId },
            include: { links: { where: { isPublic: true }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] } },
        });

        if (!user) {
            return null;
        }

        return { user: { ...user, links: nestLinks(user.links) }, canonicalUsername: user.username ?? username };
    },
    ["resolveUserByUsername"],
    { revalidate: 60, tags: ["public-profile"] }
);

/**
 * Get public user data including resume URL
 */
export const getPublicUserData = unstable_cache(
    async (username: string) => {
        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                name: true,
                username: true,
                bio: true,
                image: true,
                resumeUrl: true,
            },
        });

        return user;
    },
    ["getPublicUserData"],
    { revalidate: 60, tags: ["public-profile"] }
);

/**
 * Get all users with a published (public) profile, for sitemap generation.
 * A profile is considered "published" once the user has claimed a username.
 */
export const getPublishedUsernames = unstable_cache(
    async () => {
        const users = await prisma.user.findMany({
            where: { username: { not: null } },
            select: { username: true, createdAt: true },
        });

        return users.filter(
            (u): u is { username: string; createdAt: Date } => u.username !== null
        );
    },
    ["getPublishedUsernames"],
    { revalidate: 3600, tags: ["public-profile"] }
);
