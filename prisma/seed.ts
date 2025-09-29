import {
  ExpenseStatus,
  ExpenseType,
  FuelType,
  PrismaClient,
  VehicleFuel,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1) Usuário base
  const user = await prisma.user.upsert({
    where: { email: "demo@garagetrack.dev" },
    update: {},
    create: {
      email: "demo@garagetrack.dev",
      name: "Usuário Demo",
      image: null,
      passwordHash: null, // Se futuramente usar Credentials, podemos semear com hash
    },
  });

  // 2) Veículo do usuário
  const vehicle = await prisma.vehicle.create({
    data: {
      userId: user.id,
      nickname: "Gol 1.6",
      plate: "ABC1D23", // CITEXT: não diferencia maiúsculas/minúsculas
      odometerKm: 78500,
      fuelDefault: VehicleFuel.FLEX,
    },
  });

  // 3) Despesa: abastecimento
  const abastecimento = await prisma.expense.create({
    data: {
      userId: user.id,
      vehicleId: vehicle.id,
      type: ExpenseType.ABASTECIMENTO,
      status: ExpenseStatus.PAGO,
      date: new Date("2025-09-20"),
      amount: 230.5, // total pago (R$)
      description: "Abastecimento completo",
      km: 78510,
      fuelLiters: 32.45, // litros com 2 casas (conforme schema)
      pricePerLiter: 7.1, // preço por litro (2 casas)
      fuelType: FuelType.GASOLINA,
      station: "Posto Avenida",
      attachments: {
        create: [
          {
            url: "https://res.cloudinary.com/demo/image/upload/v1/garage/nota-abastecimento.jpg",
            contentType: "image/jpeg",
            size: 230_000,
          },
        ],
      },
    },
  });

  // 4) Despesa: manutenção
  const manutencao = await prisma.expense.create({
    data: {
      userId: user.id,
      vehicleId: vehicle.id,
      type: ExpenseType.MANUTENCAO,
      status: ExpenseStatus.PENDENTE,
      date: new Date("2025-09-25"),
      amount: 680.0,
      description: "Troca de pastilhas de freio",
      km: 78580,
      attachments: {
        create: [
          {
            url: "https://res.cloudinary.com/demo/image/upload/v1/garage/nota-manutencao.pdf",
            contentType: "application/pdf",
            size: 120_000,
          },
        ],
      },
    },
  });

  console.log({ user, vehicle, abastecimento, manutencao });
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
