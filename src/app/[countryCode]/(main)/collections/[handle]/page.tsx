import { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  getCollectionByHandle,
  getCollectionsList,
} from "@lib/data/collections"
import { StoreCollection } from "@medusajs/types"
import CollectionTemplate from "@modules/collections/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
  }>
}

const PRODUCT_LIMIT = 12

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const collection = await getCollectionByHandle(resolvedParams.handle);

  if (!collection) {
    notFound();
  }

  return {
    title: `${collection.title} | Medusa Store`,
    description: `${collection.title} collection`,
  };
}

export default async function CollectionPage(props: Props) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams
  ]);
  
  const { sortBy, page } = searchParams;
  const collection = await getCollectionByHandle(params.handle);

  if (!collection) {
    notFound();
  }

  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
      countryCode={params.countryCode}
    />
  );
}