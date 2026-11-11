"""Exact artwork-group assignment, including the old permutation tie order."""


def assign_poses(detections, actors):
    """Return actor indices, minimizing position errors, then pose errors.

    Among equal scores choose the lexicographically first index permutation,
    as itertools.permutations did. Rectangular Hungarian assignment avoids
    factorial growth when later levels contain many same-color actors.
    Inputs are saved (x, y, frame) tuples; no engine or clock is consulted.
    """
    k, n = len(detections), len(actors)
    if not 0 <= k <= n <= 31:
        raise ValueError("Expected up to31 source actors and no excess detections")
    if not k:
        return []
    scale = (n + 1) ** k
    costs = [[((d[:2] != h[:2]) * (k + 1) + (d != h)) * scale
              + j * (n + 1) ** (k - i - 1)
              for j, h in enumerate(actors)] for i, d in enumerate(detections)]
    infinity = max(map(max, costs)) * (k + 1) + 1
    u, v, matched, way = [0] * (k + 1), [0] * (n + 1), [0] * (n + 1), [0] * (n + 1)
    for i in range(1, k + 1):
        matched[0], j0 = i, 0
        minimum, used = [infinity] * (n + 1), [False] * (n + 1)
        while True:
            used[j0], i0 = True, matched[j0]
            delta, j1 = infinity, 0
            for j in range(1, n + 1):
                if used[j]:
                    continue
                cost = costs[i0 - 1][j - 1] - u[i0] - v[j]
                if cost < minimum[j]:
                    minimum[j], way[j] = cost, j0
                if minimum[j] < delta:
                    delta, j1 = minimum[j], j
            for j in range(n + 1):
                if used[j]:
                    u[matched[j]] += delta
                    v[j] -= delta
                else:
                    minimum[j] -= delta
            j0 = j1
            if matched[j0] == 0:
                break
        while j0:
            j1 = way[j0]
            matched[j0] = matched[j1]
            j0 = j1
    answer = [None] * k
    for j in range(1, n + 1):
        if matched[j]:
            answer[matched[j] - 1] = j - 1
    return answer
