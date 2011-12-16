
ANNOUNCEMENT_CHANNEL = 100
CREATE_GAME_CHANNEL = 101
GAME_CHANNEL_START = 1000;
MAX_GAMES = 1000;



namespace = "speedoku"

  cache = "games"
    max = 4096
    size = 12
  end

  script = "api_create_game"
    path = "./api_create_game.js"
  end

  script = "api_kick_user"
    path = "./api_kick_user.js"
  end

  script = "on_player_join"
    path = "./on_player_join.js"
  end

  script = "on_player_leave"
    path = "./on_player_leave.js"
  end

end



directive = "open"

  // Game announcement channel. Can be opened either in read or
  // write. Nodes acting as servers open it in `write` while
  // Nodes acting as clients open it in `read`. Read/write is 
  // not allowed.
  channel = ANNOUNCEMENT_CHANNEL
    mode = "rw, e, rwe"
      deny("BAD_ANN_MODE")
    end
    allow()
  end


  channel = CREATE_GAME_CHANNEL
    mode = "rwe"
      run("speedoku:api_create_game")
    end
    deny("BAD_CREATE_MODE")
  end


  channel = range(GAME_CHANNEL_START, GAME_CHANNEL_START + MAX_GAMES)
    mode = "rw"
      run("speedoku:on_player_join")
    end
    deny("BAD_MODE")
  end


  // Deny all channel requests, not matching above rules
  deny("NOT_ALLOWED")

end


directive = "close"

  channel = range(GAME_CHANNEL_START, GAME_CHANNEL_START + MAX_GAMES)
    run("speedoku:on_player_leave")
  end

end


directive = "emit"

  channel = range(1000, 2000)
    token = "kick_user"
      run("speedoku:api_kick_user")
    end
  end

end