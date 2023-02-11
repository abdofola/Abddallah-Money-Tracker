import React from "react";
import {
  DisplayProps,
  FilterTransactions,
  PeriodType,
} from "@features/transaction/types";
import { Tab } from "@components/Tab";
import {
  TransactionList,
  TransactionItem,
  DateSelection,
} from "@features/transaction";
import { Donut } from "@components/Chart";
import { Icon, Plus } from "@components/icons";
import { useDate } from "@components/contexts";
import { myDate } from "@lib/utils";
import { periods } from "./constants";
import { TransactionElement } from "@features/transaction/types";

const isInselectedTime = (
  selectedTime: PeriodType,
  transactionDate: Date,
  selectedDate: { start: Date; end?: Date }
): boolean => {
  const { filter } = myDate;
  const { start, end } = selectedDate;
  return {
    day: filter.inThisDateDay,
    week: filter.inThisDateWeek,
    month: filter.inThisDateMonth,
    year: filter.inThisDateYear,
    period: filter.inThisDatePeriod,
  }[selectedTime](transactionDate, start, end);
};
const filterTransactions: FilterTransactions = ({
  data,
  periodType,
  selectedDate,
}) => {
  const filteredByDate = data.filter((t) => {
    return isInselectedTime(periodType, new Date(t.date), selectedDate);
  });

  return filteredByDate;
};
const donutInnerText = (
  period: string,
  transaction: string,
  total: number = 0
) => {
  let text = "There were no ";
  if (total) return total.toFixed(2).toString().concat(" SDG");
  if (period === "day") text += `${transaction} today`;
  else text += `${transaction} in this ${period}`;
  return text;
};
const calculatePercentage = (amount: number, total: number) =>
  Math.round((amount / total) * 100);

//COMPONENT
const Display: React.FC<DisplayProps> = ({
  periodIndex,
  setPeriod,
  transactionType,
  displayOff,
}) => {
  const periodRef = React.useRef<HTMLButtonElement | null>(null);
  const { data, startDate: start, endDate: end } = useDate();
  const mergedDuplicateData = React.useMemo(() => {
    const filteredData = filterTransactions({
      data,
      periodType: periods[periodIndex]["txt"],
      selectedDate: { start, end },
    });
    const duplicates: { [k: string]: TransactionElement[] } = {};
    const merged: TransactionElement[] = [];

    // if there's only one item, then just return the array.
    if (filteredData.length < 2) return filteredData;

    for (let i = 0; i < filteredData.length; i++) {
      const trans = filteredData[i];
      const { category: elem } = trans;

      if (!(elem.id in duplicates)) duplicates[elem.id] = [];
      //don't check the same element against duplication twice.
      if (duplicates[elem.id].length > 1) continue;

      for (let j = i + 1; j < filteredData.length; j++) {
        const { category: nextElem } = filteredData[j];
        if (elem.id === nextElem.id) {
          duplicates[elem.id].push(filteredData[j]);
        }
      }

      duplicates[elem.id].push(trans);
    }

    for (let key in duplicates) {
      const amountSum = duplicates[key].reduce(
        (acc, curr) => acc + curr.amount,
        0
      );
      merged.push({
        ...duplicates[key][0],
        amount: amountSum,
        value: amountSum,
      });
    }

    return merged;
  }, [start, end, periodIndex, data]);
  const selectedPeriod = periods[periodIndex]["txt"];
  const total = mergedDuplicateData.reduce((acc, curr) => acc + curr.amount, 0);
  const Panels = periods.map((p) => {
    return (
      <Tab.Panel key={p.id}>
        <Donut
          data={mergedDuplicateData}
          donutInnerLabel={donutInnerText(
            selectedPeriod,
            transactionType,
            total
          )}
        />
      </Tab.Panel>
    );
  });

  return (
    <div className="flex flex-col gap-4 mt-4 sm:mt-8 sm:flex-row">
      <Tab.Group
        className="w-full p-2 bg-white rounded-lg border border-gray-100"
        defaultTab={periodIndex}
        onChange={setPeriod}
      >
        <Tab.List
          tabs={periods}
          className="flex justify-center gap-4 font-medium overflow-hidden before:bg-gray-600"
          renderTab={({ tab, isSelected }) => (
            <Tab
              key={tab.id}
              tab={tab}
              periodRef={periodRef}
              className={`capitalize ${
                isSelected ? "text-gray-700" : " text-gray-300"
              }`}
            />
          )}
        />
        <Tab.Panels className="relative p-4">
          <DateSelection
            periodRef={periodRef}
            className="flex mx-auto mb-8 text-sm font-medium border-b border-dashed border-gray-400"
            selection={selectedPeriod}
          />
          {Panels}
          <button
            className="absolute p-2 border rounded-full bottom-2 right-2"
            onClick={displayOff}
          >
            <Plus />
          </button>
        </Tab.Panels>
      </Tab.Group>
      <div className="flex flex-col w-full gap-3">
        <h3 className="relative z-10 w-max capitalize text-gray-700 font-medium before:absolute before:-z-10 before:left-0 before:bottom-0 before:w-full before:h-2 before:bg-gradient-to-tr from-pink-200 to-blue-100 sm:self-center">
          transactions summary
        </h3>
        {mergedDuplicateData.length === 0 && (
          <div className="flex flex-col items-center self-center max-w-[90%]">
          <span>
            <Icon href="/sprite.svg#search" />
          </span>
          <p className="text-gray-400 text-center">
            <span className="float-left">No transaction found in this time, hit </span>
            <span className="flex px-2">
            &quot;
            <Plus className="w-5 h-5" />
            &quot;
            </span>
            <span>the plus sign to add one.</span>
          </p>
          </div>
        )}
        <TransactionList
          className="hideScrollBar relative space-y-2 max-h-72 rounded-lg overflow-y-auto"
          data={mergedDuplicateData}
          renderItem={(item) => {
            const percentage = calculatePercentage(item.amount, total);
            return (
              <TransactionItem
                key={item.id}
                item={item}
                percentage={percentage.toString().concat("%")}
              />
            );
          }}
        />
      </div>
    </div>
  );
};

export { Display as default, filterTransactions };
