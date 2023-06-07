import { component$, useSignal } from "@builder.io/qwik";

export default component$(() => {
  console.log("render: <Counter/>");
  const count = useSignal(123);
  return (
    <div>
      <WrapperDisplay count={count.value} />
      <Incrementor onIncrement$={() => count.value++}>+1</Incrementor>
    </div>
  );
});

export const Display = component$<{ count: number }>(({ count }) => {
  console.log("render: <Display/>");
  return <div>count: {count}</div>;
});

export const WrapperDisplay = component$<{ count: number }>(({ count }) => {
  console.log("render: <WrapperDisplay/>");
  return <Display count={count} />;
});

export const Incrementor = component$<{ onIncrement$: () => unknown }>(
  ({ onIncrement$ }) => {
    console.log("render: <Incrementor/>");
    return <button onClick$={onIncrement$}>+1</button>;
  }
);
