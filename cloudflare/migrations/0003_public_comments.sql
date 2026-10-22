CREATE INDEX IF NOT EXISTS ratings_public_comments
ON ratings(game_id, updated_at DESC, user_id DESC)
WHERE comment <> '';
