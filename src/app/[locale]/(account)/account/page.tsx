"use client";

import React from "react";
import { useTranslations } from "next-intl";
import * as echarts from "echarts/core";
import { GridComponent, TooltipComponent } from "echarts/components";
import { BarChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import { useDebounceFn } from "ahooks";
import { Select } from "@/components/ui";
import Icon from "@/components/icon";

echarts.use([GridComponent, TooltipComponent, BarChart, CanvasRenderer]);

const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((item) => ({
  label: item,
  value: item,
}));

const Cost: React.FC = () => {
  const costRef = React.useRef<HTMLDivElement>(null);
  const costChart = React.useRef<echarts.ECharts>();
  const resizeAbort = React.useRef<AbortController>();

  const [month, setMonth] = React.useState<number>(new Date().getMonth() + 1);

  const t = useTranslations("account");

  const getMonthDate = (params: Date) => {
    const date = new Date(params);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return new Date(year, month, 0).getDate();
  };

  const getCost = async (date: Date) => {
    try {
      const url = `/api/cost?year=${date.getFullYear()}&month=${date.getMonth()}`;
      const res = await fetch(url).then((res) => res.json());
      const arr = res.data.map((item: any) => {
        const time = new Date(item.createdAt);
        return { ...item, month: time.getMonth() + 1, date: time.getDate() };
      });
      return arr;
    } catch (error) {
      return [];
    }
  };

  const setChartData = async (date: Date = new Date()) => {
    const dom = costRef.current;
    if (!dom) return;

    const days = getMonthDate(date);
    const data = await getCost(date);

    const xAxisData = [];
    const seriesData = [];
    for (let i = 0; i < days; i++) {
      xAxisData.push(String(i + 1));
      const findData = data.find((item: any) => item.date === i + 1);
      seriesData.push(findData ? findData.costUSD : 0);
    }
    if (!costChart.current) {
      costChart.current = echarts.init(dom as HTMLDivElement);
    }

    const option = {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "none",
        },
        formatter: function (params: any) {
          const value = params[0].value;
          if (!value) return "";
          return `${value}`;
        },
      },
      grid: {
        left: 70,
        right: 30,
      },
      xAxis: {
        type: "category",
        data: xAxisData,
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: "${value}",
        },
      },
      series: [
        {
          data: seriesData,
          type: "bar",
          itemStyle: {
            color: "#7fcebb",
          },
        },
      ],
    };
    costChart.current.setOption(option);
  };

  const { run: onResize } = useDebounceFn(() => costChart.current?.resize(), {
    wait: 500,
  });

  const onChange = (value: number) => {
    setMonth(value);
    setChartData(new Date(new Date().setMonth(value - 1)));
  };

  React.useEffect(() => {
    setChartData();

    resizeAbort.current = new AbortController();

    window.addEventListener("resize", onResize, {
      signal: resizeAbort.current.signal,
    });

    return () => {
      costChart.current?.dispose();
      resizeAbort.current?.abort();
    };
  }, []);

  return (
    <>
      <div className="text-2xl font-semibold">{t("usage")}</div>
      <div className="text-sm mt-4 mb-8">{t("usage-tip")}</div>
      <div className="flex items-center gap-2 mb-8">
        <div>{t("month")}</div>
        <Select
          className="w-44"
          options={months}
          value={month}
          onChange={onChange}
        />
      </div>
      <div
        ref={costRef}
        className="w-full h-80 border dark:border-neutral-500 rounded-md flex justify-center items-center"
      >
        <Icon className="animate-spin" icon="loading_line" />
      </div>
    </>
  );
};

export default Cost;
