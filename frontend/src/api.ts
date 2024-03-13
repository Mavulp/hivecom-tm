import { eru } from "@dolanske/eru";

const api = eru('https://records.hivecom.net/api')

export const maps = api.route('/maps')
export const players = api.route('/players')