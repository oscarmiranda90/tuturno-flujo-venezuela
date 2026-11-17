import {VOICE} from "./content";
export type V19Voice=keyof typeof VOICE;
export const V19_VOICE_KEYS:Record<V19Voice,string>=Object.fromEntries(Object.keys(VOICE).map(k=>[k,`tutu_${k.replaceAll("-","_")}_ve`])) as Record<V19Voice,string>;
