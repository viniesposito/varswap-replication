"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

interface OptionData {
  strike: number;
  weight: number;
}

interface GammaData {
  price: number;
  gamma: number;
}

const Home: React.FC = () => {
  // Option Parameters
  const [spotPrice, setSpotPrice] = useState<number>(100);
  const [volatility, setVolatility] = useState<number>(15);
  const [timeToMaturity, setTimeToMaturity] = useState<number>(1);

  // Variance Swap Replication Parameters
  const [minStrike, setMinStrike] = useState<number>(50);
  const [maxStrike, setMaxStrike] = useState<number>(150);
  const [strikeStep, setStrikeStep] = useState<number>(5);

  const [optionData, setOptionData] = useState<OptionData[]>([]);
  const [portfolioData, setPortfolioData] = useState<GammaData[]>([]);

  const generateData = (): {
    optionWeights: OptionData[];
    portfolioGamma: GammaData[];
  } => {
    const strikes: number[] = [];
    for (let k = minStrike; k <= maxStrike; k += strikeStep) {
      strikes.push((spotPrice * k) / 100);
    }
    const underlyingPrices = Array.from({ length: 201 }, (_, i) => i);

    let optionWeights = underlyingPrices.map((price) => {
      const percentOfSpot = (price / spotPrice) * 100;
      if (
        percentOfSpot >= minStrike &&
        percentOfSpot <= maxStrike &&
        Math.abs((percentOfSpot - minStrike) % strikeStep) < 0.001
      ) {
        return {
          strike: price,
          weight: 1 / (price * price),
        };
      }
      return {
        strike: price,
        weight: 0,
      };
    });

    const totalWeight = optionWeights.reduce(
      (sum, option) => sum + option.weight,
      0
    );

    // Normalize the weights to sum up to 100%
    optionWeights = optionWeights.map((option) => ({
      ...option,
      weight: (option.weight / totalWeight) * 100,
    }));

    const portfolioGamma = underlyingPrices.map((S) => {
      let totalGamma = 0;
      strikes.forEach((K) => {
        const weight = 1 / (K * K);
        totalGamma += (weight / 100) * calculateDollarGamma(S, K);
      });
      return { price: S, gamma: totalGamma };
    });

    console.log("Generated option weights:", optionWeights);
    console.log("Generated portfolio gamma:", portfolioGamma);

    return { optionWeights, portfolioGamma };
  };

  const calculateDollarGamma = (S: number, K: number) => {
    if (S === 0) return 0; // Gamma is 0 when price is 0
    const volDecimal = volatility / 100;
    const d1 =
      (Math.log(S / K) + ((volDecimal * volDecimal) / 2) * timeToMaturity) /
      (volDecimal * Math.sqrt(timeToMaturity));
    const gamma =
      Math.exp((-d1 * d1) / 2) /
      (K * volDecimal * Math.sqrt(2 * Math.PI * timeToMaturity));
    return (gamma * S * S) / 100;
  };

  useEffect(() => {
    const { optionWeights, portfolioGamma } = generateData();
    setOptionData(optionWeights);
    setPortfolioData(portfolioGamma);
  }, [spotPrice, volatility, timeToMaturity, minStrike, maxStrike, strikeStep]);

  return (
    <div className="min-h-screen bg-gray-50 py-6 flex flex-col justify-center sm:py-12">
      <Head>
        <title>Variance Swap Replication Intuition</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="relative py-3 px-4 w-full max-w-7xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-3 sm:rounded-3xl"></div>
        <div className="relative bg-white shadow-lg sm:rounded-3xl px-4 py-10 sm:p-20">
          <h1 className="text-3xl font-bold mb-8 text-gray-800 text-center">
            Variance Swap Replication Intuition
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="p-4 border border-gray-200 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                Option Parameters
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Spot Price
                  </label>
                  <input
                    type="number"
                    value={spotPrice}
                    onChange={(e) => setSpotPrice(Number(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Volatility (%)
                  </label>
                  <input
                    type="number"
                    value={volatility}
                    onChange={(e) => setVolatility(Number(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Time to Maturity (years)
                  </label>
                  <input
                    type="number"
                    value={timeToMaturity}
                    onChange={(e) => setTimeToMaturity(Number(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-slate-600"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                Variance Swap Replication Parameters
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Min Strike (% of spot)
                  </label>
                  <input
                    type="number"
                    value={minStrike}
                    onChange={(e) => setMinStrike(Number(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Max Strike (% of spot)
                  </label>
                  <input
                    type="number"
                    value={maxStrike}
                    onChange={(e) => setMaxStrike(Number(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Strike Step (%)
                  </label>
                  <input
                    type="number"
                    value={strikeStep}
                    onChange={(e) => setStrikeStep(Number(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-slate-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                Option Weights vs Strike
              </h2>
              <BarChart
                width={400}
                height={300}
                data={optionData as OptionData[]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="strike"
                  domain={[0, 200]}
                  ticks={[0, 50, 100, 150, 200]}
                  type="number"
                  stroke="#6b7280"
                />
                <YAxis
                  domain={[0, "auto"]}
                  tickFormatter={(value) => `${value.toFixed(0)}%`}
                  stroke="#6b7280"
                />
                {/* <Tooltip
                  formatter={(
                    value: number,
                    name: string,
                    props: { payload: { value: number } }
                  ) => [`${(value as number).toFixed(2)}%`, name]}
                /> */}
                <Legend />
                <Bar
                  dataKey="weight"
                  fill="#3b82f6"
                  name="Weight"
                  // barSize={100000}
                />
              </BarChart>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                Portfolio $Gamma Profile
              </h2>
              <LineChart
                width={400}
                height={300}
                data={portfolioData as GammaData[]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="price"
                  domain={[0, 200]}
                  ticks={[0, 50, 100, 150, 200]}
                  stroke="#6b7280"
                />
                {/* <YAxis
                  tickFormatter={(value) => `${value.toFixed(3)}`}
                  stroke="#6b7280"
                /> */}
                {/* <Tooltip /> */}
                <Legend />
                <Line
                  type="monotone"
                  dataKey="gamma"
                  stroke="#10b981"
                  name="Portfolio $Gamma"
                  dot={false}
                />
              </LineChart>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
