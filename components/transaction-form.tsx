import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "./ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Calendar } from "./ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Input } from "./ui/input";
import { addDays, format } from "date-fns";
import { categoriesTable } from "@/db/schema";

export const transactionFormSchema = z.object({
	transactionType: z.enum(["income", "expense"]),
	categoryId: z.coerce.number().positive("Please select a category"),
	transactionDate: z
		.date()
		.max(addDays(new Date(), 1), "Transaction date cannot be in the future"),
	amount: z.coerce.number().positive("Amount must be a greater than 0"),
	description: z
		.string()
		.min(3, "Description must contain at least 3 characters")
		.max(300, "Description must contain a maximum of 300 characters"),
});

export function TransactionForm({
	categories,
	onSubmit,
}: {
	categories: (typeof categoriesTable.$inferSelect)[];
	onSubmit: (
		data: z.infer<typeof transactionFormSchema>,
	) => Promise<void> | void;
}) {
	const form = useForm<z.infer<typeof transactionFormSchema>>({
		resolver: zodResolver(transactionFormSchema) as any,
		defaultValues: {
			transactionType: "income",
			categoryId: 0,
			transactionDate: new Date(),
			amount: 0,
			description: "",
		},
	});

	// React Hook Form watch so UI updates when transactionType changes
	const transactionType = form.watch("transactionType");

	const filteredCategories = categories.filter(
		(cat) => cat.type === transactionType,
	);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<fieldset className="grid grid-cols-2 gap-y-5 gap-x-2">
					<FormField
						control={form.control}
						name="transactionType"
						render={({ field }) => {
							return (
								<FormItem>
									<FormLabel>Transaction type</FormLabel>
									<FormControl>
										<Select
											value={field.value}
											onValueChange={(val) => {
												field.onChange(val);
												// reset category immediately when transaction type changes
												form.setValue("categoryId", 0);
											}}>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Transaction type" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="income">Income</SelectItem>
												<SelectItem value="expense">Expense</SelectItem>
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
					<FormField
						control={form.control}
						name="categoryId"
						render={({ field }) => {
							return (
								<FormItem>
									<FormLabel>Category</FormLabel>
									<FormControl>
										<Select
											value={field.value.toString()}
											onValueChange={(val) => field.onChange(Number(val))}>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Category" />
											</SelectTrigger>
											<SelectContent>
												{filteredCategories.map((category) => (
													<SelectItem
														key={category.id}
														value={category.id.toString()}>
														{category.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
					<FormField
						control={form.control}
						name="transactionDate"
						render={({ field }) => {
							return (
								<FormItem>
									<FormLabel>Transaction Date</FormLabel>
									<FormControl>
										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant={"outline"}
													className={cn(
														"w-full justify-start text-left font-normal",
														!field.value && "text-muted-foreground",
													)}>
													<CalendarIcon className="mr-2 h-4 w-4" />
													{field.value ? (
														format(field.value, "PPP")
													) : (
														<span>Pick a date</span>
													)}
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0">
												<Calendar
													mode="single"
													selected={field.value}
													onSelect={field.onChange}
													disabled={{
														after: new Date(),
													}}
												/>
											</PopoverContent>
										</Popover>
									</FormControl>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
					<FormField
						control={form.control}
						name="amount"
						render={({ field }) => {
							return (
								<FormItem>
									<FormLabel>Amount</FormLabel>
									<FormControl>
										<Input {...field} type="number" step={0.01} />
									</FormControl>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
				</fieldset>
				<fieldset
					disabled={form.formState.isSubmitting}
					className="mt-5 flex flex-col gap-5">
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => {
							return (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
					<Button type="submit">
						{form.formState.isSubmitting ? "Submitting..." : "Submit"}
					</Button>
				</fieldset>
			</form>
		</Form>
	);
}
