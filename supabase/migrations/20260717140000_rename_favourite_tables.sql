-- Rename favourite-related tables to the British English names used by the app.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'gym_pilot_favorite_folders'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'gym_pilot_favourite_folders'
  ) THEN
    ALTER TABLE public.gym_pilot_favorite_folders RENAME TO gym_pilot_favourite_folders;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'gym_pilot_favorites'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'gym_pilot_favourites'
  ) THEN
    ALTER TABLE public.gym_pilot_favorites RENAME TO gym_pilot_favourites;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'gym_pilot_favourites'
      AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE public.gym_pilot_favourites
      ALTER COLUMN folder_id DROP NOT NULL;
  END IF;
END $$;
