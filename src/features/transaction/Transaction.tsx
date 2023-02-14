import React from "react";
import { Tab } from "@components/Tab";
import { Money } from "@components/icons";
import { DisplayAmount, Display, TransactionForm } from "@features/transaction";
import { TransactionProps } from "@features/transaction/types";
import { DateProvider } from "@components/contexts";
import { transactionTypes, periods } from "@features/transaction/constants";
import {
  useAddTransactionMutation,
  useGetTransactionsQuery,
} from "@app/services/api";

// COMPONENT
const Transaction: React.FC<TransactionProps> = ({ user }) => {
  const [transactionIdx, setTransaction] = React.useState(1);
  const [periodIdx, setPeriod] = React.useState(0);
  const { data = { transactions: [] } } = useGetTransactionsQuery({
    userId: user.id,
  });
  const transactions = React.useMemo(() => {
    const trans = { income: [], expenses: [] };
    for (let t of data.transactions) {
      trans[t.category.type].push({
        ...t,
        key: t.id,
        color: t.category.color,
        value: t.amount,
      });
    }
    return trans;
  }, [data.transactions]);
  const [display, setDisplay] = React.useState(true);
  const [startDate, setStartDate] = React.useState(new Date());
  const [endDate, setEndDate] = React.useState<Date | null>(null);
  const [addTransaction, { isLoading }] = useAddTransactionMutation();
  const selectedTransaction = transactionTypes[transactionIdx]["txt"];
  const selectedPeriod = periods[periodIdx]["txt"];
  const total = transactions[selectedTransaction].reduce(
    (acc, curr) => acc + curr.amount,
    0
  );
  const dates = { startDate, endDate, setStartDate, setEndDate };
  const Panels = transactionTypes.map((t) => (
    <Tab.Panel key={t.id}>
      <DateProvider data={transactions[t.txt]} {...dates}>
        {display ? (
          <Display
            transactionType={t.txt}
            periodIndex={periodIdx}
            setPeriod={setPeriod}
            displayOff={() => setDisplay(false)}
          />
        ) : (
            <TransactionForm
              user={user}
              transactionType={t.txt}
              displayOn={() => setDisplay(true)}
              mutation={(data) => {
                return addTransaction({
                  ...data,
                  userId: user.id,
                }).unwrap();
              }}
              status={{ isLoading }}
            />
        )}
      </DateProvider>
    </Tab.Panel>
  ));

  //prevent selecting multiple dates from date-picker when `period` tab not selected.
  if (selectedPeriod !== "period" && endDate) {
    setEndDate(null);
  }

  return (
    <div className="flex flex-col items-center gap-4 max-w-[95%] w-[50rem] mx-auto">
      <div className="flex items-end">
        <Money className="w-5 h-5 stroke-gray-400" />
        <DisplayAmount
          amount={total}
          className="mr-3 font-medium text-gray-700"
        />
        <span className="text-gray-400">total</span>
      </div>

      <Tab.Group
        className="self-stretch"
        defaultTab={transactionIdx}
        onChange={setTransaction}
      >
        <Tab.List
          tabs={transactionTypes}
          className="flex justify-center items-center gap-10 before:bg-gray-600"
          renderTab={({ tab, isSelected }) => (
            <Tab
              key={tab.id}
              tab={tab}
              className={`uppercase font-medium ${
                isSelected ? "text-gray-700" : " text-gray-300"
              }`}
            />
          )}
        />
        <Tab.Panels>{Panels}</Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default Transaction;
