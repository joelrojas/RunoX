import { GameState } from "./models/game-state.model";
import { Player } from "./models/player.model";
import { AddPlayersCommand } from "./commands/add-players.command";
import { BuildDeckCommand } from "./commands/build-deck.command";
import { PlayCardCommand } from "./commands/play-card.command";
import { FinalizeTurnCommand } from "./commands/finalize-turn.command";
import { RegenerateDeckCommand } from "./commands/regenerate-deck.command";
import { StartGameCommand } from "./commands/start-game.command";
import { TakeDeckCardCommand } from "./commands/take-deck-card.command";
import { GameEvents, EventHandler } from "./events/game-events";
import { GameEventName } from "./events/game-events.enum";

export class GameEngine {
  private static instance: GameEngine;

  private state: GameState;
  private events: GameEvents;

  private constructor() {
    this.state = new GameState();
    this.events = GameEvents.getInstance();

    this.setSubscriptions();
  }

  static getInstance(): GameEngine {
    if (!GameEngine.instance) {
      GameEngine.instance = new GameEngine();
    }

    return GameEngine.instance;
  }

  get players() {
    return this.state.playersGroup.players;
  }

  get playerTurn() {
    return this.state.turn.player;
  }

  get stackCard() {
    return this.state.stack.cardOnTop;
  }

  setSubscriptions() {
    this.events.on(GameEventName.AFTER_TAKE_CARD, () => {
      if (!this.state.deck.cards.length) {
        const regenerateDeckCommand = new RegenerateDeckCommand();

        regenerateDeckCommand.execute(this.state);
      }
    });
  }

  start() {
    const buildDeckCommand = new BuildDeckCommand();

    buildDeckCommand.execute(this.state);

    const startGameCommand = new StartGameCommand();

    startGameCommand.execute(this.state);

    this.events.dispatch(GameEventName.AFTER_GAME_START);
  }

  join(players: Player[]) {
    const addPlayersCommand = new AddPlayersCommand(players);

    addPlayersCommand.execute(this.state);
  }

  playCard(playerId: string, cardId: string) {
    const playCardCommand = new PlayCardCommand(playerId, cardId);

    const next = playCardCommand.execute(this.state);
    if (!next) return;
    const finalizeTurnCommand = new FinalizeTurnCommand();

    finalizeTurnCommand.execute(this.state);

    this.events.dispatch(GameEventName.AFTER_PLAY_CARD);
  }

  takeCard() {
    const takeDeckCardCommand = new TakeDeckCardCommand();

    takeDeckCardCommand.execute(this.state);

    const finalizeTurnCommand = new FinalizeTurnCommand();

    finalizeTurnCommand.execute(this.state);

    this.events.dispatch(GameEventName.AFTER_TAKE_CARD);
  }

  on(event: GameEventName, action: EventHandler) {
    this.events.on(event, action);
  }
}