-- Optional MySQL VIEW: daily nutrition rollup from food_entries.
-- Created after running `npx prisma migrate dev` and adding the tables.
CREATE OR REPLACE VIEW daily_nutrition_summaries AS
SELECT
  user_id,
  logged_date AS date,
  SUM(calories)       AS total_calories,
  ROUND(SUM(protein_g), 1) AS total_protein,
  ROUND(SUM(carbs_g), 1)    AS total_carbs,
  ROUND(SUM(fat_g), 1)      AS total_fat
FROM food_entries
GROUP BY user_id, logged_date;
