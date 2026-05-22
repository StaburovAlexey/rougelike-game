import { createGame } from "./game/main";

const game = await createGame("canvas-container", { debug: true });
game.start();
