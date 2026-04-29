import { z } from "zod";

export const reportSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  heard: z.object({
    a: z.boolean(),
    b: z.boolean(),
  }),
  observedAt: z.string().min(1, "Lisää päivä ja kellonaika."),
  comment: z.string().trim().optional(),
});

export const submissionSchema = z.object({
  project: z.string().trim().min(1, "Projektin tunniste puuttuu."),
  nick: z.string().trim().min(1, "Nimimerkki tai kutsu on pakollinen."),
  email: z.string().trim().email("Anna kelvollinen sähköpostiosoite."),
  feedback: z.string().trim().optional(),
  reports: z.array(reportSchema).min(1, "Lisää vähintään yksi piste kartalle."),
});
