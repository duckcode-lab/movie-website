CREATE TABLE IF NOT EXISTS `genre` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_genre_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `movie_genre` (
  `movie_id` INT UNSIGNED NOT NULL,
  `genre_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`movie_id`, `genre_id`),
  KEY `idx_movie_genre_genre` (`genre_id`),
  CONSTRAINT `fk_movie_genre_genre`
    FOREIGN KEY (`genre_id`) REFERENCES `genre` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

START TRANSACTION;

INSERT IGNORE INTO `genre` (`name`)
WITH RECURSIVE `movie_genre_parts` (`movie_id`, `name`, `remaining`) AS (
  SELECT
    `id`,
    TRIM(SUBSTRING_INDEX(`genre`, ',', 1)),
    CASE
      WHEN LOCATE(',', `genre`) > 0
        THEN TRIM(SUBSTRING(`genre`, LOCATE(',', `genre`) + 1))
      ELSE ''
    END
  FROM `movie`
  WHERE `genre` IS NOT NULL AND TRIM(`genre`) <> ''

  UNION ALL

  SELECT
    `movie_id`,
    TRIM(SUBSTRING_INDEX(`remaining`, ',', 1)),
    CASE
      WHEN LOCATE(',', `remaining`) > 0
        THEN TRIM(SUBSTRING(`remaining`, LOCATE(',', `remaining`) + 1))
      ELSE ''
    END
  FROM `movie_genre_parts`
  WHERE `remaining` <> ''
)
SELECT DISTINCT `name`
FROM `movie_genre_parts`
WHERE `name` <> '';

DELETE FROM `movie_genre`;

INSERT IGNORE INTO `movie_genre` (`movie_id`, `genre_id`)
WITH RECURSIVE `movie_genre_parts` (`movie_id`, `name`, `remaining`) AS (
  SELECT
    `id`,
    TRIM(SUBSTRING_INDEX(`genre`, ',', 1)),
    CASE
      WHEN LOCATE(',', `genre`) > 0
        THEN TRIM(SUBSTRING(`genre`, LOCATE(',', `genre`) + 1))
      ELSE ''
    END
  FROM `movie`
  WHERE `genre` IS NOT NULL AND TRIM(`genre`) <> ''

  UNION ALL

  SELECT
    `movie_id`,
    TRIM(SUBSTRING_INDEX(`remaining`, ',', 1)),
    CASE
      WHEN LOCATE(',', `remaining`) > 0
        THEN TRIM(SUBSTRING(`remaining`, LOCATE(',', `remaining`) + 1))
      ELSE ''
    END
  FROM `movie_genre_parts`
  WHERE `remaining` <> ''
)
SELECT p.`movie_id`, g.`id`
FROM `movie_genre_parts` p
JOIN `genre` g
  ON g.`name` COLLATE utf8mb4_unicode_ci = p.`name` COLLATE utf8mb4_unicode_ci
WHERE p.`name` <> '';

DELETE g
FROM `genre` g
LEFT JOIN `movie_genre` mg ON mg.`genre_id` = g.`id`
WHERE g.`name` LIKE '%,%' AND mg.`genre_id` IS NULL;

COMMIT;
