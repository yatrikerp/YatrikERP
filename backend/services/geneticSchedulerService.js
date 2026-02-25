const Trip = require("../models/Trip");
const Route = require("../models/Route");
const Bus = require("../models/Bus");
const User = require("../models/User");
const DemandPredictionService = require("./demandPredictionService");
const CrewFatigueService = require("./crewFatigueService");

/**
 * Genetic Algorithm-based Autonomous Scheduling Engine
 * Optimizes bus, route, and crew allocation simultaneously
 * Based on research: Autonomous AI Scheduling with Genetic Algorithm
 */
class GeneticSchedulerService {
  // Genetic Algorithm Parameters
  static GA_CONFIG = {
    populationSize: 50,
    generations: 100,
    mutationRate: 0.1,
    crossoverRate: 0.7,
    elitismRate: 0.1,
  };

  // Fitness Function Weights
  static FITNESS_WEIGHTS = {
    demandFulfillment: 0.35,
    fatigueMinimization: 0.3,
    resourceUtilization: 0.2,
    operationalCost: 0.15,
  };

  /**
   * Main scheduling function using Genetic Algorithm
   */
  static async scheduleWithGA(depotId, startDate, endDate, options = {}) {
    console.log("🧬 Starting Genetic Algorithm-based scheduling...");

    try {
      // Step 1: Gather resources
      const resources = await this.gatherResources(depotId);
      console.log(
        `📊 Resources: ${resources.buses.length} buses, ${resources.drivers.length} drivers, ${resources.conductors.length} conductors`,
      );

      // Step 2: Get demand predictions
      const demandPredictions = await this.getDemandPredictions(
        resources.routes,
        startDate,
        endDate,
      );
      console.log(
        `📈 Generated ${demandPredictions.length} demand predictions`,
      );

      // Step 3: Calculate crew fatigue
      const crewFatigue = await this.getCrewFatigue(depotId, startDate);
      console.log(
        `😴 Calculated fatigue for ${crewFatigue.drivers.length + crewFatigue.conductors.length} crew members`,
      );

      // Step 4: Initialize population
      let population = this.initializePopulation(
        resources,
        demandPredictions,
        crewFatigue,
      );
      console.log(
        `🧬 Initialized population with ${population.length} chromosomes`,
      );

      // Step 5: Evolve population
      let bestSolution = null;
      let bestFitness = -Infinity;

      for (
        let generation = 0;
        generation < this.GA_CONFIG.generations;
        generation++
      ) {
        // Evaluate fitness
        const fitnessScores = population.map((chromosome) =>
          this.calculateFitness(chromosome, demandPredictions, crewFatigue),
        );

        // Track best solution
        const maxFitness = Math.max(...fitnessScores);
        const maxIndex = fitnessScores.indexOf(maxFitness);

        if (maxFitness > bestFitness) {
          bestFitness = maxFitness;
          bestSolution = JSON.parse(JSON.stringify(population[maxIndex]));
          console.log(
            `✨ Generation ${generation}: Best fitness = ${bestFitness.toFixed(2)}`,
          );
        }

        // Selection
        const selected = this.selection(population, fitnessScores);

        // Crossover
        const offspring = this.crossover(selected);

        // Mutation
        const mutated = this.mutation(offspring, resources);

        // Elitism - keep best solutions
        const eliteCount = Math.floor(
          this.GA_CONFIG.populationSize * this.GA_CONFIG.elitismRate,
        );
        const elite = this.getElite(population, fitnessScores, eliteCount);

        // New population
        population = [...elite, ...mutated].slice(
          0,
          this.GA_CONFIG.populationSize,
        );
      }

      console.log(`🎯 Final best fitness: ${bestFitness.toFixed(2)}`);

      // Step 6: Create trips from best solution
      const createdTrips = await this.createTripsFromSolution(
        bestSolution,
        depotId,
      );

      return {
        success: true,
        tripsCreated: createdTrips.length,
        bestFitness,
        solution: bestSolution,
        trips: createdTrips,
      };
    } catch (error) {
      console.error("❌ Genetic scheduling error:", error);
      throw error;
    }
  }

  /**
   * Gather available resources
   */
  static async gatherResources(depotId) {
    const buses = await Bus.find({
      depotId,
      status: { $in: ["active", "idle"] },
    }).lean();
    const drivers = await User.find({
      depotId,
      role: "driver",
      isActive: true,
    }).lean();
    const conductors = await User.find({
      depotId,
      role: "conductor",
      isActive: true,
    }).lean();
    const routes = await Route.find({ status: "active" }).lean();

    return { buses, drivers, conductors, routes };
  }

  /**
   * Get demand predictions for routes
   */
  static async getDemandPredictions(routes, startDate, endDate) {
    const predictions = [];
    const timeSlots = ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"];

    for (const route of routes.slice(0, 10)) {
      // Limit to first 10 routes for performance
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        for (const timeSlot of timeSlots) {
          try {
            const prediction = await DemandPredictionService.predictDemand(
              route._id,
              new Date(currentDate),
              timeSlot,
            );
            predictions.push(prediction);
          } catch (error) {
            console.error(
              `Prediction failed for route ${route._id}:`,
              error.message,
            );
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return predictions;
  }

  /**
   * Get crew fatigue data
   */
  static async getCrewFatigue(depotId, date) {
    return await CrewFatigueService.batchCalculateFatigue(depotId, date);
  }

  /**
   * Initialize population (random solutions)
   */
  static initializePopulation(resources, demandPredictions, crewFatigue) {
    const population = [];

    for (let i = 0; i < this.GA_CONFIG.populationSize; i++) {
      const chromosome = this.createRandomChromosome(
        resources,
        demandPredictions,
      );
      population.push(chromosome);
    }

    return population;
  }

  /**
   * Create a random chromosome (solution)
   */
  static createRandomChromosome(resources, demandPredictions) {
    const chromosome = {
      assignments: [],
    };

    // Select random subset of predictions to fulfill
    const selectedPredictions = demandPredictions
      .filter(() => Math.random() > 0.5)
      .slice(0, Math.min(20, resources.buses.length));

    for (const prediction of selectedPredictions) {
      if (
        resources.buses.length === 0 ||
        resources.drivers.length === 0 ||
        resources.conductors.length === 0
      ) {
        break;
      }

      const busIndex = Math.floor(Math.random() * resources.buses.length);
      const driverIndex = Math.floor(Math.random() * resources.drivers.length);
      const conductorIndex = Math.floor(
        Math.random() * resources.conductors.length,
      );

      chromosome.assignments.push({
        predictionId: prediction._id,
        routeId: prediction.routeId,
        busId: resources.buses[busIndex]._id,
        driverId: resources.drivers[driverIndex]._id,
        conductorId: resources.conductors[conductorIndex]._id,
        serviceDate: prediction.predictionDate,
        startTime: prediction.timeSlot,
        predictedDemand: prediction.predictedPassengers,
      });
    }

    return chromosome;
  }

  /**
   * Calculate fitness score for a chromosome
   */
  static calculateFitness(chromosome, demandPredictions, crewFatigue) {
    // Component 1: Demand Fulfillment
    const demandScore = this.calculateDemandFulfillment(
      chromosome,
      demandPredictions,
    );

    // Component 2: Fatigue Minimization
    const fatigueScore = this.calculateFatigueMinimization(
      chromosome,
      crewFatigue,
    );

    // Component 3: Resource Utilization
    const utilizationScore = this.calculateResourceUtilization(chromosome);

    // Component 4: Operational Cost
    const costScore = this.calculateOperationalCost(chromosome);

    // Weighted fitness
    const fitness =
      demandScore * this.FITNESS_WEIGHTS.demandFulfillment +
      fatigueScore * this.FITNESS_WEIGHTS.fatigueMinimization +
      utilizationScore * this.FITNESS_WEIGHTS.resourceUtilization +
      costScore * this.FITNESS_WEIGHTS.operationalCost;

    return fitness;
  }

  /**
   * Calculate demand fulfillment score
   */
  static calculateDemandFulfillment(chromosome, demandPredictions) {
    if (chromosome.assignments.length === 0) return 0;

    let totalDemand = 0;
    let fulfilledDemand = 0;

    for (const prediction of demandPredictions) {
      totalDemand += prediction.predictedPassengers;

      const assignment = chromosome.assignments.find(
        (a) => a.predictionId?.toString() === prediction._id.toString(),
      );

      if (assignment) {
        fulfilledDemand += prediction.predictedPassengers;
      }
    }

    return totalDemand > 0 ? (fulfilledDemand / totalDemand) * 100 : 0;
  }

  /**
   * Calculate fatigue minimization score
   */
  static calculateFatigueMinimization(chromosome, crewFatigue) {
    if (chromosome.assignments.length === 0) return 100;

    const allFatigue = [...crewFatigue.drivers, ...crewFatigue.conductors];
    const fatigueMap = new Map(
      allFatigue.map((f) => [f.crewId.toString(), f.fatigueScore]),
    );

    let totalFatigue = 0;
    let assignmentCount = 0;

    for (const assignment of chromosome.assignments) {
      const driverFatigue =
        fatigueMap.get(assignment.driverId?.toString()) || 0;
      const conductorFatigue =
        fatigueMap.get(assignment.conductorId?.toString()) || 0;

      totalFatigue += driverFatigue + conductorFatigue;
      assignmentCount += 2;
    }

    const avgFatigue = assignmentCount > 0 ? totalFatigue / assignmentCount : 0;
    return Math.max(0, 100 - avgFatigue);
  }

  /**
   * Calculate resource utilization score
   */
  static calculateResourceUtilization(chromosome) {
    if (chromosome.assignments.length === 0) return 0;

    const uniqueBuses = new Set(
      chromosome.assignments.map((a) => a.busId?.toString()),
    );
    const uniqueDrivers = new Set(
      chromosome.assignments.map((a) => a.driverId?.toString()),
    );
    const uniqueConductors = new Set(
      chromosome.assignments.map((a) => a.conductorId?.toString()),
    );

    const utilizationRate =
      (uniqueBuses.size + uniqueDrivers.size + uniqueConductors.size) /
      (chromosome.assignments.length * 3);

    return utilizationRate * 100;
  }

  /**
   * Calculate operational cost score (lower cost = higher score)
   */
  static calculateOperationalCost(chromosome) {
    // Simplified cost model
    const tripCost = chromosome.assignments.length * 100; // Base cost per trip
    const maxCost = 10000;

    return Math.max(0, 100 - (tripCost / maxCost) * 100);
  }

  /**
   * Selection (Tournament Selection)
   */
  static selection(population, fitnessScores) {
    const selected = [];
    const tournamentSize = 3;

    for (let i = 0; i < population.length; i++) {
      const tournament = [];

      for (let j = 0; j < tournamentSize; j++) {
        const randomIndex = Math.floor(Math.random() * population.length);
        tournament.push({
          chromosome: population[randomIndex],
          fitness: fitnessScores[randomIndex],
        });
      }

      tournament.sort((a, b) => b.fitness - a.fitness);
      selected.push(JSON.parse(JSON.stringify(tournament[0].chromosome)));
    }

    return selected;
  }

  /**
   * Crossover (Single-point crossover)
   */
  static crossover(population) {
    const offspring = [];

    for (let i = 0; i < population.length - 1; i += 2) {
      if (Math.random() < this.GA_CONFIG.crossoverRate) {
        const parent1 = population[i];
        const parent2 = population[i + 1];

        const crossoverPoint = Math.floor(
          Math.random() *
            Math.min(parent1.assignments.length, parent2.assignments.length),
        );

        const child1 = {
          assignments: [
            ...parent1.assignments.slice(0, crossoverPoint),
            ...parent2.assignments.slice(crossoverPoint),
          ],
        };

        const child2 = {
          assignments: [
            ...parent2.assignments.slice(0, crossoverPoint),
            ...parent1.assignments.slice(crossoverPoint),
          ],
        };

        offspring.push(child1, child2);
      } else {
        offspring.push(population[i], population[i + 1]);
      }
    }

    return offspring;
  }

  /**
   * Mutation
   */
  static mutation(population, resources) {
    return population.map((chromosome) => {
      if (Math.random() < this.GA_CONFIG.mutationRate) {
        const mutated = JSON.parse(JSON.stringify(chromosome));

        if (mutated.assignments.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * mutated.assignments.length,
          );

          // Randomly mutate bus, driver, or conductor
          const mutationType = Math.floor(Math.random() * 3);

          if (mutationType === 0 && resources.buses.length > 0) {
            mutated.assignments[randomIndex].busId =
              resources.buses[
                Math.floor(Math.random() * resources.buses.length)
              ]._id;
          } else if (mutationType === 1 && resources.drivers.length > 0) {
            mutated.assignments[randomIndex].driverId =
              resources.drivers[
                Math.floor(Math.random() * resources.drivers.length)
              ]._id;
          } else if (resources.conductors.length > 0) {
            mutated.assignments[randomIndex].conductorId =
              resources.conductors[
                Math.floor(Math.random() * resources.conductors.length)
              ]._id;
          }
        }

        return mutated;
      }
      return chromosome;
    });
  }

  /**
   * Get elite chromosomes
   */
  static getElite(population, fitnessScores, count) {
    const indexed = population.map((chromosome, index) => ({
      chromosome,
      fitness: fitnessScores[index],
    }));
    indexed.sort((a, b) => b.fitness - a.fitness);
    return indexed
      .slice(0, count)
      .map((item) => JSON.parse(JSON.stringify(item.chromosome)));
  }

  /**
   * Create trips from best solution
   */
  static async createTripsFromSolution(solution, depotId) {
    const createdTrips = [];

    for (const assignment of solution.assignments) {
      try {
        const route = await Route.findById(assignment.routeId);
        if (!route) continue;

        const endTime = this.calculateEndTime(
          assignment.startTime,
          route.estimatedDuration || 120,
        );

        const trip = new Trip({
          routeId: assignment.routeId,
          busId: assignment.busId,
          driverId: assignment.driverId,
          conductorId: assignment.conductorId,
          serviceDate: assignment.serviceDate,
          startTime: assignment.startTime,
          endTime,
          fare: route.baseFare || 50,
          capacity: 50,
          status: "scheduled",
          depotId,
          notes: "Created by Genetic Algorithm Scheduler",
        });

        await trip.save();
        createdTrips.push(trip);
      } catch (error) {
        console.error("Failed to create trip:", error.message);
      }
    }

    return createdTrips;
  }

  /**
   * Calculate end time
   */
  static calculateEndTime(startTime, durationMinutes) {
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
  }
}

module.exports = GeneticSchedulerService;
