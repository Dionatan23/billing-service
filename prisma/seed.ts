import { prisma } from "../src/infra/database/client";

async function main() {
  await prisma.plan.createMany({
    data: [
      // 🔹 PRÉ-PAGOS
      {
        name: "Técnico",
        slug: "tecnico",
        price: 19.9,
        credits: 10,
        duration: 15,
        type: "PREPAID",
      },
      {
        name: "Especialista",
        slug: "especialista",
        price: 29.9,
        credits: 20,
        duration: 30,
        type: "PREPAID",
      },
      {
        name: "Supervisor",
        slug: "supervisor",
        price: 49.9,
        credits: 40,
        duration: 60,
        type: "PREPAID",
      },
      {
        name: "Mestre",
        slug: "mestre",
        price: 149.9,
        credits: 80,
        duration: 180,
        type: "PREPAID",
      },
      {
        name: "Empresarial",
        slug: "empresarial",
        price: 399.9,
        credits: 150,
        duration: 365,
        type: "PREPAID",
      },

      // 🔹 ASSINATURAS
      {
        name: "Bronze",
        slug: "bronze",
        price: 29.9,
        credits: 10,
        duration: 30,
        type: "SUBSCRIPTION",
      },
      {
        name: "Platina",
        slug: "platina",
        price: 49.9,
        credits: 30,
        duration: 30,
        type: "SUBSCRIPTION",
      },
      {
        name: "Ouro",
        slug: "ouro",
        price: 89.9,
        credits: 60,
        duration: 30,
        type: "SUBSCRIPTION",
      },
      {
        name: "Esmeralda",
        slug: "esmeralda",
        price: 149.9,
        credits: 120,
        duration: 30,
        type: "SUBSCRIPTION",
      },
      {
        name: "Diamante",
        slug: "diamante",
        price: 399.9,
        credits: 999999,
        duration: 30,
        type: "SUBSCRIPTION",
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Planos criados");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });