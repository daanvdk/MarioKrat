import math
import random
from collections import deque, defaultdict
from itertools import cycle

from .models import Game, Cup, Race, Slot


def get_next_name(name):
    # If the name is the last available for its length return the first
    # available name that is one character longer
    if all(char == 'Z' for char in name):
        return 'A' * (len(name) + 1)

    # Convert name from letters to a number
    num = 0
    for char in name:
        num = num * 26 + ord(char) - ord('A')

    num += 1

    # Convert number back to letters
    next_name = ''
    for _ in range(len(name)):
        num, char_code = divmod(num, 26)
        next_name = chr(char_code + ord('A')) + next_name

    return next_name


def schedule(tournament, shuffle=True):
    next_name = 'A'
    next_round_number = 1

    players = list(tournament.players.all())

    if shuffle:
        random.shuffle(players)

    to_schedule = deque([[(1, [
        Slot.objects.create(tournament=tournament, player=player)
        for player in players
    ])]])

    while to_schedule:
        round = to_schedule.popleft()
        next_round = []

        for next_rank, slots in round:
            # If we somehow only got 1 slot thats by definition a rank
            if len(slots) == 1:
                slots[0].rank = next_rank
                slots[0].save()
                continue

            # Create games
            game_count = math.ceil(len(slots) / tournament.game_size)
            base_size, extra = divmod(len(slots), game_count)
            game_sizes = [
                base_size + (1 if i < extra else 0)
                for i in range(game_count)
            ]
            games = []
            to_add = iter(slots)
            for game_size in game_sizes:
                game = Game.objects.create(
                    tournament=tournament,
                    name=next_name,
                    round=next_round_number,
                )
                for cup_number in range(1, tournament.game_cups + 1):
                    cup = Cup.objects.create(game=game, number=cup_number)
                    for race_number in range(1, tournament.game_races + 1):
                        Race.objects.create(cup=cup, number=race_number)

                for _ in range(game_size):
                    slot = next(to_add)
                    slot.target = game
                    slot.save()

                games.append(game)
                next_name = get_next_name(next_name)

            # Add players out to games
            if len(games) == 1:
                # Final game so we divide ranks here
                game = games[0]
                for pos in range(1, game.players_in.count() + 1):
                    Slot.objects.create(
                        tournament=tournament,
                        source=game,
                        position=pos,
                        rank=next_rank,
                    )
                    next_rank += 1
            else:
                # We group the new slots by rank
                new_slots = defaultdict(list)
                for game in games:
                    players = game.players_in.count()
                    for pos in range(1, players + 1):
                        rel_pos = (pos - 1) / (players - 1)
                        new_slots[rel_pos].append(Slot.objects.create(
                            tournament=tournament,
                            source=game,
                            position=pos,
                        ))
                # Divide into top half and bottom half
                top_half = []
                bottom_half = []
                for key in sorted(new_slots):
                    if key <= 0.5:
                        top_half.extend(new_slots[key])
                    else:
                        bottom_half.extend(new_slots[key])
                # Schedule halfs
                next_round.append((next_rank, top_half))
                next_round.append((next_rank + len(top_half), bottom_half))

        if next_round:
            to_schedule.append(next_round)
        next_round_number += 1
