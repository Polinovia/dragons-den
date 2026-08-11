-- CreateEnum
CREATE TYPE "SecurityQuestion" AS ENUM ('FIRST_PET', 'CHILDHOOD_STREET', 'MOTHERS_MAIDEN_NAME', 'FIRST_SCHOOL', 'FAVORITE_TEACHER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "securityAnswerHash" TEXT,
ADD COLUMN     "securityQuestion" "SecurityQuestion";
