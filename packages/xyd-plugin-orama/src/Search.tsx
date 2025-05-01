import React, { useEffect } from "react"

import { Badge } from "@xyd-js/components/writer"
// import { OramaSearchBox, OramaSearchButton } from "@orama/react-components"

export function SearchButton() {
    // async function loadData() {
    //     // @ts-ignore
    //     const data = await import('virtual:xyd-plugin-orama-data')

    //     console.log(data)
    // }

    // useEffect(() => {
    //     loadData()
    // }, [])


    return <>
        <div>
            <Badge>
                Hello World 3
            </Badge>
        </div>
        {/* <OramaSearchButton
            size="large"
            colorScheme="dark"
        >
            Search something...
        </OramaSearchButton>

        <OramaSearchBox
            placeholder="Search something..."
            index={{
                endpoint: process.env.ORAMA_ENDPOINT || "",
                api_key: process.env.ORAMA_API_KEY || ""
            }}
            resultMap={{
                title: 'name',
                description: 'content',
                section: 'category',
            }}
        /> */}
    </>
} 