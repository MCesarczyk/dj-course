export function useWarehousingPagination(itemsPerPage = 10) {
  const currentPage = ref(1)

  const previousPage = () => {
    if (currentPage.value > 1) currentPage.value--
  }

  const nextPage = () => {
    currentPage.value++
  }

  const goToPage = (page: number) => {
    currentPage.value = page
  }

  const resetPage = () => {
    currentPage.value = 1
  }

  return { currentPage, itemsPerPage, previousPage, nextPage, goToPage, resetPage }
}
