'use server'
import {sql} from "@/databases/neon";
import { cacheLife } from 'next/cache';

export async function getAppProjectCards() {
    'use cache';
    try {
        //await new Promise((resolve) => setTimeout(resolve, 40000))
        cacheLife('hours');
        return sql`SELECT * FROM app_cards WHERE type = 'project'`
    } catch (error) {
        throw new Error('Failed to get projects data.')
    }
}

export async function getAppBlogCards() {
    'use cache';
    try {
        cacheLife('hours');
        return sql`SELECT * FROM app_cards WHERE type = 'blog'`
    } catch (error) {
        throw new Error('Failed to get projects data.')
    }
}
