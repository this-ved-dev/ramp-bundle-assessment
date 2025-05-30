import { Fragment, useCallback, useEffect, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee, Transaction} from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [localTransactions, setLocalTransactions] = useState<Transaction[] | null>(null)

  useEffect(() => {
    if (paginatedTransactions?.data) {
      setLocalTransactions(paginatedTransactions.data)
    } else if (transactionsByEmployee) {
      setLocalTransactions(transactionsByEmployee)
    }
  }, [paginatedTransactions?.data, transactionsByEmployee])

  const updateApproval = (transactionId: string, newValue: boolean) => {
    setLocalTransactions((prev) =>
      prev?.map((tx) =>
        tx.id === transactionId ? { ...tx, approved: newValue } : tx
      ) ?? null
    )
  }



  const loadAllTransactions = useCallback(async () => {
    transactionsByEmployeeUtils.invalidateData()

    if (employees === null) {
      setLoadingEmployees(true)
      await employeeUtils.fetchAll()
      setLoadingEmployees(false)
    }

    await paginatedTransactionsUtils.fetchAll()
  }, [employees, employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={loadingEmployees}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null || newValue.id === EMPTY_EMPLOYEE.id) {
              await loadAllTransactions()
            } else {
              await loadTransactionsByEmployee(newValue.id)
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions
            transactions={localTransactions}
            onTransactionApprovalChange={updateApproval}
          />


          {paginatedTransactions?.nextPage !== null && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}

        </div>
      </main>
    </Fragment>
  )
}
