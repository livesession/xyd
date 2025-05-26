1. support nested inline default values if possible?
```graphql
type Mutation {
    setData(input: DataInput! = {
        name: "new data"
    }): Data
}
```