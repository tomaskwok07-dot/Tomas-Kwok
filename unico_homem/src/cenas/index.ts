import {CenaDef} from './tipos';
import {abertura} from './abertura';
import {celular} from './celular';
import {closenovato} from './closenovato';
import {cenasA} from './cenas_a';
import {cenasB} from './cenas_b';
import {cenasC} from './cenas_c';

export const CENAS: Record<string, CenaDef> = {abertura, celular, closenovato, ...cenasA, ...cenasB, ...cenasC};
