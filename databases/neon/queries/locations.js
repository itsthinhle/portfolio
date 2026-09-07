'use server'
import {sql} from "@/databases/neon";
import { cacheLife } from 'next/cache';

export async function getStatesIds() {
    'use cache';
    try {
        cacheLife('hours');
        return sql`SELECT id FROM states`
    } catch (error) {
        throw new Error('Failed to get state ids.')
    }
}

export async function getCityNamesByStateId(_stateId) {
    'use cache';
    try {
        cacheLife('hours');
        return sql`SELECT city from cities WHERE state_id = ${_stateId}`
    } catch (error) {
        throw new Error('Failed to get cities.')
    }
}